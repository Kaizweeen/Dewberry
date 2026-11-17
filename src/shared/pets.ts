import { topCutoff } from './ranking';

export const PETS = ['star', 'slime', 'angel'] as const;
export type PetId = (typeof PETS)[number];
export const PET_NAME_MAX = 10;
/** The pet's fullness runs from 0 to FULL_MAX. */
export const FULL_MAX = 3;
/** How many times one food can be fed before it is gone. */
export const SERVINGS = 3;

/** Fullness today: what it was on `fullDay`, less 1 for each day since, never below 0. */
export function fullnessOn(
  full: number,
  fullDay: number,
  today: number
): number {
  return Math.max(0, Math.min(full, FULL_MAX) - Math.max(0, today - fullDay));
}

export const isPetId = (v: unknown): v is PetId => PETS.some((p) => p === v);

/** How many pets a player may have unlocked: 1, plus 1 at a best streak of 7, plus 1 at 30. */
export function petSlots(bestStreak: number): number {
  return 1 + (bestStreak >= 7 ? 1 : 0) + (bestStreak >= 30 ? 1 : 0);
}

/** The item ranks (1 to 3) a player earns for a finalized day they played. */
export function earnedRanks(a: {
  rank: number | null;
  count: number;
  itemRanks: number[];
  madeRank: number | null;
}): number[] {
  const inTop = a.rank !== null && a.rank <= topCutoff(a.count);
  const earned = a.itemRanks.filter(
    (r) => r === a.madeRank || r === 1 || inTop
  );
  return [...new Set(earned)].sort((x, y) => x - y);
}

/** A trimmed name of 1 to PET_NAME_MAX letters, digits, or spaces. null if it is not one. */
export function cleanPetName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const name = v.trim();
  if (name.length < 1 || name.length > PET_NAME_MAX) return null;
  return /^[A-Za-z0-9 ]+$/.test(name) ? name : null;
}
