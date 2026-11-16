export const GRID = 8;
export const CELLS = GRID * GRID;
export const COLORS = 4;
export const MIN_PIXELS = 4;

export type EntryCheck = { ok: true } | { ok: false; reason: string };

export function countColors(entry: string): number[] {
  const counts = [0, 0, 0, 0];
  for (const ch of entry) {
    const v = ch.charCodeAt(0) - 48;
    if (v >= 1 && v <= COLORS) counts[v - 1] = (counts[v - 1] ?? 0) + 1;
  }
  return counts;
}

export function validateEntry(entry: unknown, budget: number[]): EntryCheck {
  if (typeof entry !== 'string' || entry.length !== CELLS) {
    return { ok: false, reason: 'A drawing must have 64 cells.' };
  }
  if (!/^[0-4]{64}$/.test(entry)) {
    return { ok: false, reason: 'The drawing has an invalid cell.' };
  }
  const counts = countColors(entry);
  if (counts.reduce((a, b) => a + b, 0) < MIN_PIXELS) {
    return { ok: false, reason: 'Paint at least 4 pixels.' };
  }
  for (let i = 0; i < COLORS; i++) {
    if ((counts[i] ?? 0) > (budget[i] ?? 0)) {
      return { ok: false, reason: `Too many pixels of color ${i + 1}.` };
    }
  }
  return { ok: true };
}
