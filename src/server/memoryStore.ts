import type { Store } from './store';

function getOrCreate<V>(
  map: Map<string, Map<string, V>>,
  key: string
): Map<string, V> {
  const found = map.get(key);
  if (found) return found;
  const created = new Map<string, V>();
  map.set(key, created);
  return created;
}

export function memoryStore(): Store {
  const strings = new Map<string, string>();
  const hashes = new Map<string, Map<string, string>>();
  const zsets = new Map<string, Map<string, number>>();
  const h = (k: string) => getOrCreate(hashes, k);
  const z = (k: string) => getOrCreate(zsets, k);
  return {
    async get(k) {
      return strings.get(k);
    },
    async set(k, v) {
      strings.set(k, v);
    },
    async hGet(k, f) {
      return h(k).get(f);
    },
    async hSet(k, fields) {
      for (const [f, v] of Object.entries(fields)) h(k).set(f, v);
    },
    async hSetNX(k, f, v) {
      if (h(k).has(f)) return false;
      h(k).set(f, v);
      return true;
    },
    async hGetAll(k) {
      return Object.fromEntries(h(k));
    },
    async hLen(k) {
      return h(k).size;
    },
    async hDel(k, fields) {
      return fields.filter((f) => h(k).delete(f)).length;
    },
    async zAdd(k, member, score) {
      z(k).set(member, score);
    },
    async zIncrBy(k, member, by) {
      const next = (z(k).get(member) ?? 0) + by;
      z(k).set(member, next);
      return next;
    },
    async zScore(k, member) {
      return z(k).get(member);
    },
    async zAll(k) {
      return [...z(k)]
        .map(([member, score]) => ({ member, score }))
        .sort((a, b) => a.score - b.score);
    },
  };
}
