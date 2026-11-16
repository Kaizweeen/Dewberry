import { describe, expect, it } from 'vitest';
import {
  currentDay,
  finalizeDay,
  getResults,
  heartEntry,
  rollover,
  submitEntry,
} from './game';
import { memoryStore } from './memoryStore';
import { keys, type Store } from './store';

const pad = (s: string) => s + '0'.repeat(64 - s.length);
const HOUR = 60 * 60 * 1000;
const createPost = async (day: number) => `post${day}`;

async function dayOne(): Promise<Store> {
  const store = memoryStore();
  await rollover(store, { now: 0, createPost });
  return store;
}

const submit = (store: Store, userId: string, now: number) =>
  submitEntry(store, {
    day: 1,
    userId,
    username: `name-${userId}`,
    entry: pad('1111'),
    now,
  });
const heart = (store: Store, userId: string, targetId: string) =>
  heartEntry(store, { day: 1, userId, targetId });

describe('rollover', () => {
  it('creates day 1 on the first run', async () => {
    const store = memoryStore();
    expect(await rollover(store, { now: 0, createPost })).toEqual({
      day: 1,
      postId: 'post1',
    });
    expect(await currentDay(store)).toBe(1);
    expect(await store.get(keys.postDay('post1'))).toBe('1');
    expect(await store.get(keys.dayPost(1))).toBe('post1');
  });

  it('does nothing when run again too soon', async () => {
    const store = await dayOne();
    expect(await rollover(store, { now: 1 * HOUR, createPost })).toBeNull();
    expect(await currentDay(store)).toBe(1);
  });

  it('advances after a full day', async () => {
    const store = await dayOne();
    expect(await rollover(store, { now: 24 * HOUR, createPost })).toEqual({
      day: 2,
      postId: 'post2',
    });
  });

  it('can be forced for playtesting', async () => {
    const store = await dayOne();
    expect(
      await rollover(store, { now: 1 * HOUR, force: true, createPost })
    ).toEqual({ day: 2, postId: 'post2' });
  });
});

describe('finalizeDay and getResults', () => {
  it('ranks by hearts then by earlier submission, and stores the top three', async () => {
    const store = await dayOne();
    await submit(store, 'a', 100);
    await submit(store, 'b', 200);
    await submit(store, 'c', 300);
    await submit(store, 'd', 400);
    await heart(store, 'a', 'c');
    await heart(store, 'b', 'c');
    await heart(store, 'c', 'b');
    await heart(store, 'd', 'a');
    await rollover(store, { now: 24 * HOUR, createPost });

    const results = await getResults(store, { day: 1, userId: 'd' });
    expect(results.count).toBe(4);
    expect(results.myRank).toBe(4);
    expect(results.top.map((t) => [t.rank, t.username, t.hearts])).toEqual([
      [1, 'name-c', 2],
      [2, 'name-a', 1],
      [3, 'name-b', 1],
    ]);
    expect(results.top[0]?.entry).toBe(pad('1111'));
  });

  it('stores only as many items as there are entries', async () => {
    const store = await dayOne();
    await submit(store, 'a', 100);
    await rollover(store, { now: 24 * HOUR, createPost });
    const results = await getResults(store, { day: 1, userId: 'a' });
    expect(results.top).toHaveLength(1);
    expect(results.myRank).toBe(1);
  });

  it('handles a day with no entries', async () => {
    const store = await dayOne();
    await rollover(store, { now: 24 * HOUR, createPost });
    expect(await getResults(store, { day: 1, userId: 'a' })).toEqual({
      count: 0,
      myRank: null,
      top: [],
    });
  });

  it('leaves hidden entries out of the ranking', async () => {
    const store = await dayOne();
    await submit(store, 'a', 100);
    await submit(store, 'b', 200);
    await heart(store, 'b', 'a');
    await store.hSet(keys.hidden(1), { a: '1' });
    await rollover(store, { now: 24 * HOUR, createPost });
    const results = await getResults(store, { day: 1, userId: 'a' });
    expect(results.count).toBe(1);
    expect(results.myRank).toBeNull();
    expect(results.top.map((t) => t.username)).toEqual(['name-b']);
  });

  it('does not change results when finalized twice', async () => {
    const store = await dayOne();
    await submit(store, 'a', 100);
    await rollover(store, { now: 24 * HOUR, createPost });
    const before = await getResults(store, { day: 1, userId: 'a' });
    await store.zIncrBy(keys.hearts(1), 'a', 50);
    await finalizeDay(store, 1);
    expect(await getResults(store, { day: 1, userId: 'a' })).toEqual(before);
  });
});
