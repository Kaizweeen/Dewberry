import { beforeEach, describe, expect, it } from 'vitest';
import { getGalleryPage, heartEntry, submitEntry } from './game';
import { memoryStore } from './memoryStore';
import { keys, type Store } from './store';

const pad = (s: string) => s + '0'.repeat(64 - s.length);
const submit = (store: Store, userId: string) =>
  submitEntry(store, {
    day: 1,
    userId,
    username: `name-${userId}`,
    entry: pad('1111'),
    now: 1000,
  });

async function dayWith(users: string[]): Promise<Store> {
  const store = memoryStore();
  await store.set(keys.currentDay, '1');
  for (const u of users) await submit(store, u);
  return store;
}

const others = (n: number) => Array.from({ length: n }, (_, i) => `o${i}`);

describe('getGalleryPage', () => {
  it('is locked until the viewer submits', async () => {
    const store = await dayWith(['a']);
    expect(
      await getGalleryPage(store, { day: 1, userId: 'viewer' })
    ).toBeNull();
  });

  it('never shows the viewer their own entry', async () => {
    const store = await dayWith(['viewer', 'a', 'b']);
    const page = await getGalleryPage(store, { day: 1, userId: 'viewer' });
    expect(page?.entries.map((e) => e.id).sort()).toEqual(['a', 'b']);
    expect(page?.heartsLeft).toBe(5);
  });

  it('is empty when the viewer is the only player', async () => {
    const store = await dayWith(['viewer']);
    expect(
      (await getGalleryPage(store, { day: 1, userId: 'viewer' }))?.entries
    ).toEqual([]);
  });

  it('serves pages of 12 and never repeats an entry', async () => {
    const store = await dayWith(['viewer', ...others(15)]);
    const p1 = await getGalleryPage(store, { day: 1, userId: 'viewer' });
    const p2 = await getGalleryPage(store, { day: 1, userId: 'viewer' });
    const p3 = await getGalleryPage(store, { day: 1, userId: 'viewer' });
    expect(p1?.entries).toHaveLength(12);
    expect(p2?.entries).toHaveLength(3);
    expect(p3?.entries).toHaveLength(0);
    const seen = [...(p1?.entries ?? []), ...(p2?.entries ?? [])].map(
      (e) => e.id
    );
    expect(new Set(seen).size).toBe(15);
  });

  it('shows the least seen entries first', async () => {
    const store = await dayWith(['v1', 'v2', ...others(12)]);
    await getGalleryPage(store, { day: 1, userId: 'v1' });
    const unseen = (await store.zAll(keys.views(1)))
      .filter((v) => v.score === 0 && v.member !== 'v2')
      .map((v) => v.member);
    const page = await getGalleryPage(store, { day: 1, userId: 'v2' });
    const ids = page?.entries.map((e) => e.id) ?? [];
    for (const id of unseen) expect(ids).toContain(id);
  });

  it('skips hidden entries', async () => {
    const store = await dayWith(['viewer', 'a', 'b']);
    await store.hSet(keys.hidden(1), { a: '1' });
    const page = await getGalleryPage(store, { day: 1, userId: 'viewer' });
    expect(page?.entries.map((e) => e.id)).toEqual(['b']);
  });
});

describe('heartEntry', () => {
  let store: Store;
  beforeEach(async () => {
    store = await dayWith(['viewer', ...others(6)]);
  });

  it('adds a heart and counts down', async () => {
    expect(
      await heartEntry(store, { day: 1, userId: 'viewer', targetId: 'o0' })
    ).toEqual({
      ok: true,
      heartsLeft: 4,
    });
    expect(await store.zScore(keys.hearts(1), 'o0')).toBe(1);
  });

  it('refuses a second heart on the same entry', async () => {
    await heartEntry(store, { day: 1, userId: 'viewer', targetId: 'o0' });
    expect(
      await heartEntry(store, { day: 1, userId: 'viewer', targetId: 'o0' })
    ).toEqual({
      ok: false,
      error: 'already',
    });
    expect(await store.zScore(keys.hearts(1), 'o0')).toBe(1);
  });

  it('refuses a sixth heart', async () => {
    for (let i = 0; i < 5; i++)
      await heartEntry(store, { day: 1, userId: 'viewer', targetId: `o${i}` });
    expect(
      await heartEntry(store, { day: 1, userId: 'viewer', targetId: 'o5' })
    ).toEqual({
      ok: false,
      error: 'none-left',
    });
  });

  it('refuses your own entry', async () => {
    expect(
      await heartEntry(store, { day: 1, userId: 'viewer', targetId: 'viewer' })
    ).toEqual({
      ok: false,
      error: 'own',
    });
  });

  it('refuses players who have not submitted', async () => {
    expect(
      await heartEntry(store, { day: 1, userId: 'lurker', targetId: 'o0' })
    ).toEqual({
      ok: false,
      error: 'not-submitted',
    });
  });

  it('refuses an entry that does not exist', async () => {
    expect(
      await heartEntry(store, { day: 1, userId: 'viewer', targetId: 'nobody' })
    ).toEqual({
      ok: false,
      error: 'missing',
    });
  });

  it('refuses a closed day', async () => {
    await store.set(keys.currentDay, '2');
    expect(
      await heartEntry(store, { day: 1, userId: 'viewer', targetId: 'o0' })
    ).toEqual({
      ok: false,
      error: 'closed',
    });
  });
});
