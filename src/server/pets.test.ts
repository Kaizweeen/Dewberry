import { describe, expect, it } from 'vitest';
import { getDayView, heartEntry, rollover, submitEntry } from './game';
import { memoryStore } from './memoryStore';
import { claimRewards, getPetView, updatePet } from './pets';
import { keys, type Store } from './store';
import type { PetAction } from '../shared/types';

const lineEntry = (length = 60) =>
  JSON.stringify([{ c: '#333333', p: [10, 10, 10 + length, 10] }]);
const entryFor = (now: number) => lineEntry(60 + (now % 50));
const createPost = async (day: number) => `post${day}`;
const roll = (store: Store, now = 0) =>
  rollover(store, { now, force: true, createPost });

async function startedStore(): Promise<Store> {
  const store = memoryStore();
  await roll(store);
  return store;
}

const submit = (store: Store, day: number, userId: string, now: number) =>
  submitEntry(store, {
    day,
    userId,
    username: `name-${userId}`,
    entry: entryFor(now),
    now,
  });

/** Day 1 with u1..u4 submitting in order, so ranks follow the order. Day 1 is then closed. */
async function closedDayOfFour(): Promise<Store> {
  const store = await startedStore();
  for (const [i, id] of ['u1', 'u2', 'u3', 'u4'].entries())
    await submit(store, 1, id, 100 + i);
  await roll(store, 1);
  return store;
}

const ids = (items: { id: string }[]) => items.map((i) => i.id);
const update = (store: Store, action: PetAction | unknown, userId = 'u1') =>
  updatePet(store, { userId, action });

describe('the reward table', () => {
  it('gives the maker of each top three item that item, and everyone rank 1', async () => {
    const store = await closedDayOfFour();
    // 4 entries: the top 25 percent is rank 1 only.
    const got = async (u: string) =>
      ids((await claimRewards(store, u))?.items ?? []).sort();
    expect(await got('u1')).toEqual(['1:1', '1:2', '1:3']);
    expect(await got('u2')).toEqual(['1:1', '1:2']);
    expect(await got('u3')).toEqual(['1:1', '1:3']);
    expect(await got('u4')).toEqual(['1:1']);
  });

  it('works through hearts: more hearts means a better rank', async () => {
    const store = await startedStore();
    for (const [i, id] of ['u1', 'u2', 'u3', 'u4'].entries())
      await submit(store, 1, id, 100 + i);
    await heartEntry(store, { day: 1, userId: 'u1', targetId: 'u4' });
    await heartEntry(store, { day: 1, userId: 'u2', targetId: 'u4' });
    await roll(store, 1);
    const claim = await claimRewards(store, 'u4');
    expect(claim?.days).toEqual([{ day: 1, rank: 1, count: 4 }]);
    expect(ids(claim?.items ?? [])).toEqual(['1:1', '1:2', '1:3']);
    expect(claim?.items[0]).toMatchObject({
      day: 1,
      rank: 1,
      category: 'food',
      maker: 'name-u4',
      entry: entryFor(103),
    });
  });

  it('gives nothing to someone who did not play', async () => {
    const store = await closedDayOfFour();
    expect(await claimRewards(store, 'stranger')).toBeNull();
  });
});

describe('claimRewards', () => {
  it('hands out a claim once', async () => {
    const store = await closedDayOfFour();
    expect(await claimRewards(store, 'u1')).not.toBeNull();
    expect(await claimRewards(store, 'u1')).toBeNull();
    expect((await getPetView(store, 'u1')).items).toHaveLength(3);
  });

  it('skips a day that is not finalized and claims it later', async () => {
    const store = await closedDayOfFour();
    await submit(store, 2, 'u1', 200);
    const first = await claimRewards(store, 'u1');
    expect(first?.days.map((d) => d.day)).toEqual([1]);
    await roll(store, 2);
    const second = await claimRewards(store, 'u1');
    expect(second?.days).toEqual([{ day: 2, rank: 1, count: 1 }]);
    expect(ids(second?.items ?? [])).toEqual(['2:1']);
  });

  it('combines several days, ascending, in one claim', async () => {
    const store = await closedDayOfFour();
    await submit(store, 2, 'u1', 200);
    await roll(store, 2);
    const claim = await claimRewards(store, 'u1');
    expect(claim?.days.map((d) => d.day)).toEqual([1, 2]);
  });

  it('gives one claim when two calls run at once', async () => {
    const store = await closedDayOfFour();
    const results = await Promise.all([
      claimRewards(store, 'u1'),
      claimRewards(store, 'u1'),
    ]);
    expect(results.filter((r) => r !== null)).toHaveLength(1);
    expect(await store.hLen(keys.items('u1'))).toBe(3);
  });

  it('is part of the day view, once', async () => {
    const store = await closedDayOfFour();
    const args = { day: 2, userId: 'u1', postId: 'post2' };
    const first = await getDayView(store, args);
    expect(ids(first.claim?.items ?? [])).toEqual(['1:1', '1:2', '1:3']);
    expect(first.fed).toBe(false);
    expect((await getDayView(store, args)).claim).toBeNull();
    await submit(store, 2, 'u1', 300);
    expect((await getDayView(store, args)).fed).toBe(true);
    // Viewing the old post does not make the player fed today.
    const old = await getDayView(store, { ...args, day: 1, postId: 'post1' });
    expect(old.fed).toBe(true);
  });
});

describe('getPetView', () => {
  it('starts with no pet and no name', async () => {
    const view = await getPetView(memoryStore(), 'u1');
    expect(view).toEqual({
      pet: null,
      name: '',
      unlocked: [],
      slots: 1,
      placed: {
        food: null,
        clothes: null,
        sceneryBack: null,
        sceneryFront: null,
      },
      items: [],
    });
  });

  it('names a pet after itself until renamed, and orders items newest first', async () => {
    const store = await closedDayOfFour();
    await submit(store, 2, 'u1', 200);
    await roll(store, 2);
    await claimRewards(store, 'u1');
    await update(store, { type: 'pick', pet: 'slime' });
    const view = await getPetView(store, 'u1');
    expect(view.name).toBe('Slime');
    expect(ids(view.items)).toEqual(['2:1', '1:1', '1:2', '1:3']);
  });

  it('leaves out an owned item with no entry', async () => {
    const store = memoryStore();
    await store.hSet(keys.items('u1'), { '9:1': '1' });
    expect((await getPetView(store, 'u1')).items).toEqual([]);
  });
});

describe('pick', () => {
  it('picks a first pet, and a switch needs no slot', async () => {
    const store = memoryStore();
    const r = await update(store, { type: 'pick', pet: 'star' });
    expect(r).toMatchObject({
      ok: true,
      pet: { pet: 'star', unlocked: ['star'] },
    });
    await update(store, { type: 'name', name: 'Bean' });
    const same = await update(store, { type: 'pick', pet: 'star' });
    expect(same).toMatchObject({ ok: true, pet: { name: 'Bean' } });
  });

  it('refuses a second pet until the best streak is 7, then 30', async () => {
    const store = memoryStore();
    await update(store, { type: 'pick', pet: 'star' });
    const refusal = {
      ok: false,
      reason: 'Keep your streak going to unlock another pet.',
    };
    expect(await update(store, { type: 'pick', pet: 'slime' })).toEqual(
      refusal
    );
    await store.hSet(keys.player('u1'), { best: '7' });
    const two = await update(store, { type: 'pick', pet: 'slime' });
    expect(two).toMatchObject({
      ok: true,
      pet: { pet: 'slime', unlocked: ['star', 'slime'], slots: 2 },
    });
    expect(await update(store, { type: 'pick', pet: 'angel' })).toEqual(
      refusal
    );
    await store.hSet(keys.player('u1'), { best: '30' });
    const three = await update(store, { type: 'pick', pet: 'angel' });
    expect(three).toMatchObject({
      ok: true,
      pet: { pet: 'angel', unlocked: ['star', 'slime', 'angel'] },
    });
    // Back to an unlocked pet.
    expect(await update(store, { type: 'pick', pet: 'star' })).toMatchObject({
      ok: true,
      pet: { pet: 'star' },
    });
  });

  it('clears the name when a different pet is picked', async () => {
    const store = memoryStore();
    await store.hSet(keys.player('u1'), { best: '7' });
    await update(store, { type: 'pick', pet: 'star' });
    await update(store, { type: 'name', name: 'Bean' });
    const r = await update(store, { type: 'pick', pet: 'slime' });
    expect(r).toMatchObject({ ok: true, pet: { name: 'Slime' } });
  });
});

describe('name', () => {
  it('needs a pet', async () => {
    expect(
      await update(memoryStore(), { type: 'name', name: 'Bean' })
    ).toMatchObject({
      ok: false,
    });
  });

  it('trims a good name and refuses a bad one', async () => {
    const store = memoryStore();
    await update(store, { type: 'pick', pet: 'angel' });
    expect(await update(store, { type: 'name', name: ' Bean ' })).toMatchObject(
      {
        ok: true,
        pet: { name: 'Bean' },
      }
    );
    for (const name of ['', 'way too long name', 'a!', 7]) {
      expect(await update(store, { type: 'name', name })).toEqual({
        ok: false,
        reason: 'Use 1 to 10 letters or numbers.',
      });
    }
    expect((await getPetView(store, 'u1')).name).toBe('Bean');
  });
});

describe('toggle', () => {
  const seed = async (store: Store) => {
    const made: [string, string][] = [
      ['1:1', 'food'],
      ['1:2', 'food'],
      ['2:1', 'clothes'],
      ['3:1', 'scenery'],
      ['3:2', 'scenery'],
      ['3:3', 'scenery'],
    ];
    for (const [id, category] of made) {
      const [day, rank] = id.split(':');
      await store.hSet(keys.item(Number(day), Number(rank)), {
        entry: lineEntry(),
        category,
        maker: 'm',
        makerId: 'x',
      });
      await store.hSet(keys.items('u1'), { [id]: '1' });
    }
    await update(store, { type: 'pick', pet: 'star' });
  };
  const toggle = (store: Store, itemId: string) =>
    update(store, { type: 'toggle', itemId });
  const placed = async (store: Store) => {
    const p = (await getPetView(store, 'u1')).placed;
    return [p.food, p.clothes, p.sceneryBack, p.sceneryFront].map(
      (i) => i?.id ?? null
    );
  };

  it('refuses an item the player does not own', async () => {
    const store = memoryStore();
    await seed(store);
    expect(await toggle(store, '9:9')).toEqual({
      ok: false,
      reason: 'That item is not yours.',
    });
  });

  it('places, replaces, and removes food and clothes', async () => {
    const store = memoryStore();
    await seed(store);
    await toggle(store, '1:1');
    await toggle(store, '2:1');
    expect(await placed(store)).toEqual(['1:1', '2:1', null, null]);
    await toggle(store, '1:2');
    expect(await placed(store)).toEqual(['1:2', '2:1', null, null]);
    await toggle(store, '1:2');
    await toggle(store, '2:1');
    expect(await placed(store)).toEqual([null, null, null, null]);
  });

  it('fills scenery back then front, then replaces back, and removes from either', async () => {
    const store = memoryStore();
    await seed(store);
    await toggle(store, '3:1');
    await toggle(store, '3:2');
    expect(await placed(store)).toEqual([null, null, '3:1', '3:2']);
    await toggle(store, '3:3');
    expect(await placed(store)).toEqual([null, null, '3:3', '3:2']);
    await toggle(store, '3:2');
    expect(await placed(store)).toEqual([null, null, '3:3', null]);
    await toggle(store, '3:3');
    expect(await placed(store)).toEqual([null, null, null, null]);
  });

  it('does not show a placed item that is no longer owned', async () => {
    const store = memoryStore();
    await seed(store);
    await toggle(store, '1:1');
    await store.hDel(keys.items('u1'), ['1:1']);
    expect(await placed(store)).toEqual([null, null, null, null]);
  });
});

describe('bad actions', () => {
  it('refuses anything else', async () => {
    const store = memoryStore();
    const bad = { ok: false, reason: 'That did not work. Try again.' };
    for (const a of [
      null,
      'pick',
      {},
      { type: 'pick', pet: 'dog' },
      { type: 'toggle', itemId: 5 },
      { type: 'fly' },
    ])
      expect(await update(store, a)).toEqual(bad);
  });
});
