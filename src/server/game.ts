import { contentForDay } from '../shared/content';
import { validateEntry } from '../shared/entry';
import { rankEntries } from '../shared/ranking';
import { nextStreak } from '../shared/streak';
import type {
  DayView,
  GalleryPage,
  HeartResult,
  Results,
  SubmitResult,
} from '../shared/types';
import { claimRewards, getPetView } from './pets';
import { keys, type Store } from './store';

export const HEARTS_PER_DAY = 5;

export async function currentDay(store: Store): Promise<number> {
  return Number((await store.get(keys.currentDay)) ?? 0);
}

async function playerState(store: Store, userId: string) {
  const p = await store.hGetAll(keys.player(userId));
  return {
    streak: Number(p.streak ?? 0),
    best: Number(p.best ?? 0),
    lastPlayed: Number(p.lastPlayed ?? 0),
  };
}

export async function getDayView(
  store: Store,
  a: { day: number; userId: string; postId: string }
): Promise<DayView> {
  const content = contentForDay(a.day);
  const today = await currentDay(store);
  const [myEntry, entryCount, heartsUsed, myHearts, player, todayPostId] =
    await Promise.all([
      store.hGet(keys.entries(a.day), a.userId),
      store.hLen(keys.entries(a.day)),
      store.hLen(keys.hearted(a.day, a.userId)),
      store.zScore(keys.hearts(a.day), a.userId),
      playerState(store, a.userId),
      store.get(keys.dayPost(today)),
    ]);
  const claim = await claimRewards(store, a.userId);
  const pet = await getPetView(store, a.userId);
  return {
    day: a.day,
    postId: a.postId,
    open: a.day === today,
    todayPostId: todayPostId ?? null,
    prompt: content.prompt,
    category: content.category,
    budget: content.budget,
    entryCount,
    myEntry: myEntry ?? null,
    myHearts: myHearts ?? 0,
    // A streak is live only if the player played today or yesterday.
    streak: player.lastPlayed >= today - 1 ? player.streak : 0,
    heartsLeft: HEARTS_PER_DAY - heartsUsed,
    pet: pet.pet,
    petName: pet.name,
    fullness: pet.fullness,
    placed: pet.placed,
    claim,
  };
}

export async function submitEntry(
  store: Store,
  a: {
    day: number;
    userId: string;
    username: string;
    entry: unknown;
    now: number;
  }
): Promise<SubmitResult> {
  if (a.day !== (await currentDay(store))) {
    return { ok: false, error: 'closed', reason: 'This day has ended.' };
  }
  const check = validateEntry(a.entry, contentForDay(a.day).budget);
  if (!check.ok) return { ok: false, error: 'invalid', reason: check.reason };
  // validateEntry already guarantees a string; this narrows the type without a cast.
  if (typeof a.entry !== 'string') {
    return { ok: false, error: 'invalid', reason: 'Entry must be a string.' };
  }
  const entry = a.entry;

  const fresh = await store.hSetNX(keys.entries(a.day), a.userId, entry);
  const player = await playerState(store, a.userId);
  if (!fresh) {
    const existing = (await store.hGet(keys.entries(a.day), a.userId)) ?? entry;
    return { ok: true, entry: existing, streak: player.streak };
  }

  const streak = nextStreak(player, a.day);
  await Promise.all([
    store.hSet(keys.names(a.day), { [a.userId]: a.username }),
    store.zAdd(keys.times(a.day), a.userId, a.now),
    store.zAdd(keys.hearts(a.day), a.userId, 0),
    store.zAdd(keys.views(a.day), a.userId, 0),
    store.hSet(keys.player(a.userId), {
      streak: String(streak),
      best: String(Math.max(player.best, streak)),
      lastPlayed: String(a.day),
    }),
    store.hSet(keys.played(a.userId), { [String(a.day)]: '1' }),
  ]);
  return { ok: true, entry, streak };
}

export const PAGE_SIZE = 12;

/** A stable per-viewer shuffle key, so ties are ordered differently for each viewer. */
function tieKey(viewerId: string, memberId: string): number {
  let h = 2166136261;
  for (const ch of `${viewerId}:${memberId}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function getGalleryPage(
  store: Store,
  a: { day: number; userId: string }
): Promise<GalleryPage | null> {
  const [entries, views, served, hidden, heartsUsed] = await Promise.all([
    store.hGetAll(keys.entries(a.day)),
    store.zAll(keys.views(a.day)),
    store.hGetAll(keys.served(a.day, a.userId)),
    store.hGetAll(keys.hidden(a.day)),
    store.hLen(keys.hearted(a.day, a.userId)),
  ]);
  if (!(a.userId in entries)) return null;

  const viewCount = new Map(views.map((v) => [v.member, v.score]));
  // ponytail: reads the whole day on every page. Fine for a few thousand entries.
  // Move to a score-ranged zRange if days grow past that.
  const page = Object.keys(entries)
    .filter((id) => id !== a.userId && !(id in served) && !(id in hidden))
    .sort(
      (x, y) =>
        (viewCount.get(x) ?? 0) - (viewCount.get(y) ?? 0) ||
        tieKey(a.userId, x) - tieKey(a.userId, y)
    )
    .slice(0, PAGE_SIZE);

  // Claim each id; a parallel request from this viewer may have taken some already.
  const claimed = (
    await Promise.all(
      page.map(async (id) =>
        (await store.hSetNX(keys.served(a.day, a.userId), id, '1')) ? id : null
      )
    )
  ).filter((id) => id !== null);
  await Promise.all(
    claimed.map((id) => store.zIncrBy(keys.views(a.day), id, 1))
  );
  return {
    entries: claimed.flatMap((id) => {
      const entry = entries[id];
      return entry === undefined ? [] : [{ id, entry }];
    }),
    heartsLeft: HEARTS_PER_DAY - heartsUsed,
  };
}

export async function heartEntry(
  store: Store,
  a: { day: number; userId: string; targetId: string }
): Promise<HeartResult> {
  if (a.day !== (await currentDay(store)))
    return { ok: false, error: 'closed' };
  if (a.targetId === a.userId) return { ok: false, error: 'own' };
  const [mine, target, already, used] = await Promise.all([
    store.hGet(keys.entries(a.day), a.userId),
    store.hGet(keys.entries(a.day), a.targetId),
    store.hGet(keys.hearted(a.day, a.userId), a.targetId),
    store.hLen(keys.hearted(a.day, a.userId)),
  ]);
  if (!mine) return { ok: false, error: 'not-submitted' };
  if (!target) return { ok: false, error: 'missing' };
  if (already) return { ok: false, error: 'already' };
  if (used >= HEARTS_PER_DAY) return { ok: false, error: 'none-left' };
  const fresh = await store.hSetNX(
    keys.hearted(a.day, a.userId),
    a.targetId,
    '1'
  );
  if (!fresh) return { ok: false, error: 'already' };
  // Re-check the hash after writing: parallel taps can pass the read above, so undo if over the limit.
  const total = await store.hLen(keys.hearted(a.day, a.userId));
  if (total > HEARTS_PER_DAY) {
    await store.hDel(keys.hearted(a.day, a.userId), [a.targetId]);
    return { ok: false, error: 'none-left' };
  }
  await store.zIncrBy(keys.hearts(a.day), a.targetId, 1);
  return { ok: true, heartsLeft: HEARTS_PER_DAY - total };
}

export const MIN_ROLL_GAP_MS = 12 * 60 * 60 * 1000;
/** How long a rollover claim is honored before another call may take it over. */
const STALE_CLAIM_MS = 10 * 60 * 1000;

export async function finalizeDay(store: Store, day: number): Promise<void> {
  if (day < 1) return;
  if ((await store.hGet(keys.final(day), 'count')) !== undefined) return;

  const [entries, names, hearts, times, hidden] = await Promise.all([
    store.hGetAll(keys.entries(day)),
    store.hGetAll(keys.names(day)),
    store.zAll(keys.hearts(day)),
    store.zAll(keys.times(day)),
    store.hGetAll(keys.hidden(day)),
  ]);
  const heartOf = new Map(hearts.map((h) => [h.member, h.score]));
  const timeOf = new Map(times.map((t) => [t.member, t.score]));
  const ranked = rankEntries(
    Object.keys(entries)
      .filter((id) => !(id in hidden))
      .map((id) => ({
        id,
        hearts: heartOf.get(id) ?? 0,
        time: timeOf.get(id) ?? 0,
      }))
  );

  const content = contentForDay(day);
  for (const [i, id] of ranked.slice(0, 3).entries()) {
    const entry = entries[id];
    if (entry === undefined) continue;
    await store.hSet(keys.item(day, i + 1), {
      entry,
      category: content.category,
      maker: names[id] ?? '',
      makerId: id,
      hearts: String(heartOf.get(id) ?? 0),
    });
  }

  // Written last, so a crash before this point makes the next run redo the whole day.
  const final: Record<string, string> = { count: String(ranked.length) };
  ranked.forEach((id, i) => {
    final[`rank:${id}`] = String(i + 1);
  });
  await store.hSet(keys.final(day), final);
}

export async function getResults(
  store: Store,
  a: { day: number; userId: string }
): Promise<Results> {
  const [count, myRank, items] = await Promise.all([
    store.hGet(keys.final(a.day), 'count'),
    store.hGet(keys.final(a.day), `rank:${a.userId}`),
    Promise.all([1, 2, 3].map((rank) => store.hGetAll(keys.item(a.day, rank)))),
  ]);
  return {
    count: Number(count ?? 0),
    myRank: myRank === undefined ? null : Number(myRank),
    top: items
      .map((it, i) => ({
        rank: i + 1,
        username: it.maker ?? '',
        entry: it.entry ?? '',
        hearts: Number(it.hearts ?? 0),
      }))
      .filter((t) => t.entry !== ''),
  };
}

export async function rollover(
  store: Store,
  a: {
    now: number;
    force?: boolean;
    createPost: (day: number) => Promise<string>;
  }
): Promise<{ day: number; postId: string } | null> {
  const last = await store.get(keys.rolledAt);
  if (!a.force && last !== undefined && a.now - Number(last) < MIN_ROLL_GAP_MS)
    return null;

  const closing = await currentDay(store);
  await finalizeDay(store, closing);
  const day = closing + 1;
  const won = await store.hSetNX(keys.rollClaim, String(day), String(a.now));
  if (!won) {
    // A claim this old belongs to a call that died mid-rollover. Take it over,
    // or the game would never roll again.
    // ponytail: the takeover is not atomic. Two calls hitting the same stale claim
    // at once could both post. Use a Redis transaction if that ever happens.
    const claimedAt = Number(
      (await store.hGet(keys.rollClaim, String(day))) ?? a.now
    );
    if (a.now - claimedAt < STALE_CLAIM_MS) return null;
    await store.hSet(keys.rollClaim, { [String(day)]: String(a.now) });
  }
  let postId: string;
  try {
    postId = await a.createPost(day);
  } catch (err) {
    await store.hDel(keys.rollClaim, [String(day)]);
    throw err;
  }
  await store.set(keys.postDay(postId), String(day));
  await store.set(keys.dayPost(day), postId);
  await store.set(keys.currentDay, String(day));
  await store.set(keys.rolledAt, String(a.now));
  return { day, postId };
}
