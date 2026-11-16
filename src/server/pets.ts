import {
  PETS,
  cleanPetName,
  earnedRanks,
  isPetId,
  petSlots,
} from '../shared/pets';
import type { Claim, Item, Placed, PetResult, PetView } from '../shared/types';
import { keys, type Store } from './store';

const RANKS = [1, 2, 3];
const BAD_ACTION = 'That did not work. Try again.';

/** Builds an item from its stored hash. null when it is not a full item. */
function toItem(
  day: number,
  rank: number,
  it: Record<string, string>
): Item | null {
  const { entry, category } = it;
  if (!entry) return null;
  if (category !== 'food' && category !== 'clothes' && category !== 'scenery')
    return null;
  return {
    id: `${day}:${rank}`,
    day,
    rank,
    category,
    entry,
    maker: it.maker ?? '',
  };
}

const readItem = async (store: Store, day: number, rank: number) =>
  toItem(day, rank, await store.hGetAll(keys.item(day, rank)));

const itemFromId = (store: Store, id: string) => {
  const [day, rank] = id.split(':').map(Number);
  return day === undefined || rank === undefined
    ? Promise.resolve(null)
    : readItem(store, day, rank);
};

/**
 * Adds the items earned on every finalized, unclaimed day the player played.
 * ponytail: reads the whole played hash each time. Fine for a season of days.
 * Track a high-water day if it ever matters.
 * Known ceiling: if the response is lost the items are still owned, only the card is not shown.
 */
export async function claimRewards(
  store: Store,
  userId: string
): Promise<Claim | null> {
  const [played, claimed] = await Promise.all([
    store.hGetAll(keys.played(userId)),
    store.hGetAll(keys.claimed(userId)),
  ]);
  const days: Claim['days'] = [];
  const items: Item[] = [];
  const pending = Object.keys(played)
    .filter((d) => !(d in claimed))
    .map(Number)
    .sort((a, b) => a - b);
  for (const day of pending) {
    const final = await store.hGetAll(keys.final(day));
    if (final.count === undefined) continue;
    if (!(await store.hSetNX(keys.claimed(userId), String(day), '1'))) continue;
    const rank = final[`rank:${userId}`];
    const count = Number(final.count);
    let got: Item[];
    try {
      const top = await Promise.all(
        RANKS.map(async (r) => {
          const it = await store.hGetAll(keys.item(day, r));
          return { rank: r, item: toItem(day, r, it), makerId: it.makerId };
        })
      );
      const earned = earnedRanks({
        rank: rank === undefined ? null : Number(rank),
        count,
        itemRanks: top.flatMap((t) => (t.item ? [t.rank] : [])),
        madeRank: top.find((t) => t.makerId === userId)?.rank ?? null,
      });
      got = top.flatMap((t) =>
        t.item && earned.includes(t.rank) ? [t.item] : []
      );
      if (got.length > 0)
        await store.hSet(
          keys.items(userId),
          Object.fromEntries(got.map((i) => [i.id, '1']))
        );
    } catch (err) {
      // Give the day back, or a store error here would lose its items for good.
      await store.hDel(keys.claimed(userId), [String(day)]);
      throw err;
    }
    days.push({ day, rank: rank === undefined ? null : Number(rank), count });
    items.push(...got);
  }
  return days.length > 0 ? { days, items } : null;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export async function getPetView(
  store: Store,
  userId: string
): Promise<PetView> {
  const [p, owned, unlockedHash] = await Promise.all([
    store.hGetAll(keys.player(userId)),
    store.hGetAll(keys.items(userId)),
    store.hGetAll(keys.pets(userId)),
  ]);
  const items = (
    await Promise.all(Object.keys(owned).map((id) => itemFromId(store, id)))
  )
    .flatMap((i) => (i ? [i] : []))
    .sort((a, b) => b.day - a.day || a.rank - b.rank);
  const find = (id: string | undefined) =>
    items.find((i) => i.id === id) ?? null;
  const placed: Placed = {
    food: find(p.food),
    clothes: find(p.clothes),
    sceneryBack: find(p.sceneryBack),
    sceneryFront: find(p.sceneryFront),
  };
  const pet = isPetId(p.pet) ? p.pet : null;
  return {
    pet,
    name: pet === null ? '' : p.petName || capital(pet),
    unlocked: PETS.filter((id) => id in unlockedHash),
    slots: petSlots(Number(p.best ?? 0)),
    placed,
    items,
  };
}

type Slot = 'food' | 'clothes' | 'sceneryBack' | 'sceneryFront';

export async function updatePet(
  store: Store,
  a: { userId: string; action: unknown }
): Promise<PetResult> {
  const fail = (reason: string): PetResult => ({ ok: false, reason });
  const done = async (): Promise<PetResult> => ({
    ok: true,
    pet: await getPetView(store, a.userId),
  });
  const act = a.action;
  if (typeof act !== 'object' || act === null || !('type' in act))
    return fail(BAD_ACTION);
  const player = keys.player(a.userId);

  if (act.type === 'pick') {
    const pet: unknown = 'pet' in act ? act.pet : undefined;
    if (!isPetId(pet)) return fail(BAD_ACTION);
    const [p, unlocked] = await Promise.all([
      store.hGetAll(player),
      store.hGetAll(keys.pets(a.userId)),
    ]);
    if (!(pet in unlocked)) {
      // ponytail: two parallel picks could pass this check and unlock one extra pet.
      if (Object.keys(unlocked).length >= petSlots(Number(p.best ?? 0)))
        return fail('Keep your streak going to unlock another pet.');
      await store.hSet(keys.pets(a.userId), { [pet]: '1' });
    }
    if (p.pet !== pet) {
      await store.hDel(player, ['petName']);
      await store.hSet(player, { pet });
    }
    return done();
  }

  if (act.type === 'name') {
    const name = cleanPetName('name' in act ? act.name : undefined);
    if (name === null) return fail('Use 1 to 10 letters or numbers.');
    if (!isPetId(await store.hGet(player, 'pet'))) return fail(BAD_ACTION);
    await store.hSet(player, { petName: name });
    return done();
  }

  if (act.type === 'toggle') {
    const itemId: unknown = 'itemId' in act ? act.itemId : undefined;
    if (typeof itemId !== 'string') return fail(BAD_ACTION);
    const item =
      (await store.hGet(keys.items(a.userId), itemId)) !== undefined
        ? await itemFromId(store, itemId)
        : null;
    if (!item) return fail('That item is not yours.');
    const p = await store.hGetAll(player);
    const set = (slot: Slot) => store.hSet(player, { [slot]: item.id });
    if (item.category !== 'scenery') {
      const slot = item.category;
      if (p[slot] === item.id) await store.hDel(player, [slot]);
      else await set(slot);
    } else if (p.sceneryBack === item.id) {
      await store.hDel(player, ['sceneryBack']);
    } else if (p.sceneryFront === item.id) {
      await store.hDel(player, ['sceneryFront']);
    } else {
      await set(
        !p.sceneryBack
          ? 'sceneryBack'
          : !p.sceneryFront
            ? 'sceneryFront'
            : 'sceneryBack'
      );
    }
    return done();
  }

  return fail(BAD_ACTION);
}
