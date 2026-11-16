export type Store = {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  hGet(key: string, field: string): Promise<string | undefined>;
  hSet(key: string, fields: Record<string, string>): Promise<void>;
  /** Sets the field only if it is absent. Returns true when it was set. */
  hSetNX(key: string, field: string, value: string): Promise<boolean>;
  hGetAll(key: string): Promise<Record<string, string>>;
  hLen(key: string): Promise<number>;
  /** Removes the fields. Returns how many were removed. */
  hDel(key: string, fields: string[]): Promise<number>;
  zAdd(key: string, member: string, score: number): Promise<void>;
  zIncrBy(key: string, member: string, by: number): Promise<number>;
  zScore(key: string, member: string): Promise<number | undefined>;
  /** Every member with its score, lowest score first. */
  zAll(key: string): Promise<{ member: string; score: number }[]>;
};

export const keys = {
  currentDay: 'day:current',
  rolledAt: 'day:rolledAt',
  rollClaim: 'roll:claim',
  postDay: (postId: string) => `post:${postId}`,
  dayPost: (day: number) => `daypost:${day}`,
  entries: (day: number) => `entry:${day}`,
  names: (day: number) => `entryname:${day}`,
  times: (day: number) => `entrytime:${day}`,
  hearts: (day: number) => `hearts:${day}`,
  views: (day: number) => `views:${day}`,
  hearted: (day: number, userId: string) => `hearted:${day}:${userId}`,
  served: (day: number, userId: string) => `served:${day}:${userId}`,
  hidden: (day: number) => `hidden:${day}`,
  final: (day: number) => `final:${day}`,
  item: (day: number, rank: number) => `item:${day}:${rank}`,
  player: (userId: string) => `player:${userId}`,
  played: (userId: string) => `played:${userId}`,
  pets: (userId: string) => `pets:${userId}`,
  items: (userId: string) => `items:${userId}`,
  claimed: (userId: string) => `claimed:${userId}`,
};
