export const SIZE = 256; // the paper is SIZE x SIZE units; coordinates are integers 0..SIZE-1
export const STROKE_WIDTH = 8;
export const DOT_INK = 8; // every line costs at least this much, so a tap (a dot) is not free
export const MIN_INK = 40; // minimum total cost to submit
export const MIN_STEP = 3; // the client records a point after the pointer moved this far
export const MAX_STROKES = 200;
export const MAX_POINTS = 3000; // across all lines; one point is one x,y pair
export const MAX_ENTRY_CHARS = 24000;

export type Stroke = { c: string; p: number[] }; // c: '#rrggbb' lowercase; p: [x0, y0, x1, y1, ...]
export type Drawing = Stroke[];
export type EntryCheck = { ok: true } | { ok: false; reason: string };

/** Sum of straight distances between consecutive points. */
export function strokeLength(p: number[]): number {
  let total = 0;
  for (let i = 2; i + 1 < p.length; i += 2) {
    const dx = (p[i] ?? 0) - (p[i - 2] ?? 0);
    const dy = (p[i + 1] ?? 0) - (p[i - 1] ?? 0);
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

/** What one line costs: its length, but never less than DOT_INK. */
export function strokeCost(p: number[]): number {
  return Math.max(strokeLength(p), DOT_INK);
}

/** Total cost of a drawing. */
export function inkUsed(drawing: Drawing): number {
  let total = 0;
  for (const s of drawing) total += strokeCost(s.p);
  return total;
}

function isCoord(n: unknown): n is number {
  return Number.isInteger(n) && typeof n === 'number' && n >= 0 && n < SIZE;
}

/** Parses and shape-checks an entry string. Returns null if it is not a well-formed drawing. Does not check the meter or the minimum. */
export function parseEntry(entry: unknown): Drawing | null {
  if (typeof entry !== 'string' || entry.length > MAX_ENTRY_CHARS) return null;
  let value: unknown;
  try {
    value = JSON.parse(entry);
  } catch {
    return null;
  }
  if (!Array.isArray(value) || value.length > MAX_STROKES) return null;
  const drawing: Drawing = [];
  let points = 0;
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return null;
    }
    if (!('c' in item) || !('p' in item)) return null;
    const { c, p } = item;
    if (typeof c !== 'string' || !/^#[0-9a-f]{6}$/.test(c)) return null;
    if (!Array.isArray(p) || p.length < 4 || p.length % 2 !== 0) return null;
    const coords: number[] = [];
    for (const n of p) {
      if (!isCoord(n)) return null;
      coords.push(n);
    }
    points += coords.length / 2;
    if (points > MAX_POINTS) return null;
    drawing.push({ c, p: coords });
  }
  return drawing;
}

/** The compact string the game stores: JSON.stringify of the lines, each with keys in the order c, p. */
export function toEntryString(drawing: Drawing): string {
  return JSON.stringify(drawing.map((s) => ({ c: s.c, p: s.p })));
}

export function validateEntry(entry: unknown, budget: number): EntryCheck {
  const parsed = parseEntry(entry);
  if (parsed === null || toEntryString(parsed) !== entry) {
    return { ok: false, reason: 'That drawing could not be read.' };
  }
  const ink = inkUsed(parsed);
  if (ink < MIN_INK) {
    return { ok: false, reason: 'Draw a little more before you submit.' };
  }
  if (ink > budget) {
    return {
      ok: false,
      reason: 'That drawing uses more line than today allows.',
    };
  }
  return { ok: true };
}
