import { beforeEach, describe, expect, it } from 'vitest';
import { getDayView, submitEntry } from './game';
import { memoryStore } from './memoryStore';
import { keys, type Store } from './store';

/** A valid entry: one horizontal line of the given length in the given color. */
export const lineEntry = (length = 60, color = '#333333') =>
  JSON.stringify([{ c: color, p: [10, 10, 10 + length, 10] }]);

/** A store already on the given day, with a post recorded for it. */
export async function storeOnDay(day: number): Promise<Store> {
  const store = memoryStore();
  await store.set(keys.currentDay, String(day));
  await store.set(keys.dayPost(day), `post${day}`);
  return store;
}

export const submit = (
  store: Store,
  day: number,
  userId: string,
  entry = lineEntry(),
  now = 1000
) =>
  submitEntry(store, {
    day,
    userId,
    username: `name-${userId}`,
    entry,
    now,
  });

describe('submitEntry', () => {
  let store: Store;
  beforeEach(async () => {
    store = await storeOnDay(1);
  });

  it('stores a valid entry and starts a streak', async () => {
    expect(await submit(store, 1, 'u1')).toEqual({
      ok: true,
      entry: lineEntry(),
      streak: 1,
    });
    expect(await store.hGet(keys.entries(1), 'u1')).toBe(lineEntry());
  });

  it('keeps the first entry when submitted twice', async () => {
    await submit(store, 1, 'u1', lineEntry(60));
    expect(await submit(store, 1, 'u1', lineEntry(80))).toEqual({
      ok: true,
      entry: lineEntry(),
      streak: 1,
    });
    expect(await store.hLen(keys.entries(1))).toBe(1);
  });

  it('rejects an invalid entry and stores nothing', async () => {
    const r = await submit(store, 1, 'u1', lineEntry(10));
    expect(r).toMatchObject({ ok: false, error: 'invalid' });
    expect(await store.hLen(keys.entries(1))).toBe(0);
  });

  it('rejects an entry over the day budget and stores nothing', async () => {
    const tooLong = JSON.stringify(
      Array.from({ length: 8 }, (_, i) => ({
        c: '#333333',
        p: [10, 10 + i * 10, 210, 10 + i * 10],
      }))
    );
    const r = await submit(store, 1, 'u1', tooLong);
    expect(r).toMatchObject({ ok: false, error: 'invalid' });
    expect(await store.hLen(keys.entries(1))).toBe(0);
  });

  it('rejects a closed day', async () => {
    await store.set(keys.currentDay, '2');
    expect(await submit(store, 1, 'u1')).toMatchObject({
      ok: false,
      error: 'closed',
    });
  });

  it('extends a streak on consecutive days and resets after a gap', async () => {
    await submit(store, 1, 'u1');
    await store.set(keys.currentDay, '2');
    expect(await submit(store, 2, 'u1')).toMatchObject({ streak: 2 });
    await store.set(keys.currentDay, '4');
    expect(await submit(store, 4, 'u1')).toMatchObject({ streak: 1 });
  });
});

describe('getDayView', () => {
  it('describes an open day for a new player', async () => {
    const store = await storeOnDay(1);
    const view = await getDayView(store, {
      day: 1,
      userId: 'u1',
      postId: 'post1',
    });
    expect(view).toMatchObject({
      day: 1,
      postId: 'post1',
      open: true,
      todayPostId: 'post1',
      prompt: 'a breakfast',
      category: 'food',
      entryCount: 0,
      myEntry: null,
      myHearts: 0,
      streak: 0,
      heartsLeft: 5,
    });
    expect(view.budget).toBe(1400);
    expect(view).not.toHaveProperty('colors');
  });

  it('shows the player their entry and the entry count', async () => {
    const store = await storeOnDay(1);
    await submit(store, 1, 'u1');
    await submit(store, 1, 'u2');
    const view = await getDayView(store, {
      day: 1,
      userId: 'u1',
      postId: 'post1',
    });
    expect(view).toMatchObject({
      entryCount: 2,
      myEntry: lineEntry(),
      streak: 1,
    });
  });

  it('marks a past day closed and points at today', async () => {
    const store = await storeOnDay(2);
    const view = await getDayView(store, {
      day: 1,
      userId: 'u1',
      postId: 'post1',
    });
    expect(view).toMatchObject({ open: false, todayPostId: 'post2' });
  });

  it('shows a lapsed streak as zero', async () => {
    const store = await storeOnDay(1);
    await submit(store, 1, 'u1');
    await store.set(keys.currentDay, '3');
    const view = await getDayView(store, {
      day: 3,
      userId: 'u1',
      postId: 'post3',
    });
    expect(view.streak).toBe(0);
  });
});
