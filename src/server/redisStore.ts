import { redis } from '@devvit/web/server';
import type { Store } from './store';

/** The production Store: a thin adapter over Devvit Redis. All game rules live in game.ts. */
export const redisStore: Store = {
  get: (k) => redis.get(k),
  set: async (k, v) => {
    await redis.set(k, v);
  },
  hGet: (k, f) => redis.hGet(k, f),
  hSet: async (k, fields) => {
    await redis.hSet(k, fields);
  },
  hSetNX: async (k, f, v) => (await redis.hSetNX(k, f, v)) === 1,
  hGetAll: (k) => redis.hGetAll(k),
  hLen: (k) => redis.hLen(k),
  hDel: (k, fields) => redis.hDel(k, fields),
  zAdd: async (k, member, score) => {
    await redis.zAdd(k, { member, score });
  },
  zIncrBy: (k, member, by) => redis.zIncrBy(k, member, by),
  zScore: (k, member) => redis.zScore(k, member),
  zAll: (k) => redis.zRange(k, 0, -1, { by: 'rank' }),
};
