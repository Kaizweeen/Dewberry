import { contentForDay } from '../shared/content';
import { validateEntry } from '../shared/entry';
import { nextStreak } from '../shared/streak';
import type {
  DayView,
  GalleryPage,
  HeartResult,
  SubmitResult,
} from '../shared/types';
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
  return {
    day: a.day,
    postId: a.postId,
    open: a.day === today,
    todayPostId: todayPostId ?? null,
    prompt: content.prompt,
    category: content.category,
    colors: content.colors,
    colorNames: content.colorNames,
    budget: content.budget,
    entryCount,
    myEntry: myEntry ?? null,
    myHearts: myHearts ?? 0,
    // A streak is live only if the player played today or yesterday.
    streak: player.lastPlayed >= today - 1 ? player.streak : 0,
    heartsLeft: HEARTS_PER_DAY - heartsUsed,
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

  if (page.length > 0) {
    await store.hSet(
      keys.served(a.day, a.userId),
      Object.fromEntries(page.map((id) => [id, '1']))
    );
    await Promise.all(
      page.map((id) => store.zIncrBy(keys.views(a.day), id, 1))
    );
  }
  return {
    entries: page.flatMap((id) => {
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
  // ponytail: check then write. Two simultaneous taps could spend a sixth heart.
  // Wrap in a Redis transaction if that ever shows up.
  const fresh = await store.hSetNX(
    keys.hearted(a.day, a.userId),
    a.targetId,
    '1'
  );
  if (!fresh) return { ok: false, error: 'already' };
  await store.zIncrBy(keys.hearts(a.day), a.targetId, 1);
  return { ok: true, heartsLeft: HEARTS_PER_DAY - used - 1 };
}
