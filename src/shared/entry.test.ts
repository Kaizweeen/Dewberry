import { describe, expect, it } from 'vitest';
import {
  DOT_INK,
  MAX_ENTRY_CHARS,
  MAX_POINTS,
  MAX_STROKES,
  MIN_INK,
  inkUsed,
  parseEntry,
  strokeCost,
  strokeLength,
  toEntryString,
  validateEntry,
} from './entry';

/** Lines of at most 200 units each, adding up to exactly `length`. */
const line = (length: number, color = '#333333') => {
  const strokes = [];
  for (let left = length, y = 10; left > 0; left -= 200, y += 10) {
    strokes.push({ c: color, p: [10, y, 10 + Math.min(left, 200), y] });
  }
  return JSON.stringify(strokes);
};

describe('strokeLength', () => {
  it('measures a 3-4-5 segment', () => {
    expect(strokeLength([0, 0, 3, 4])).toBe(5);
  });
  it('sums every segment of a longer line', () => {
    expect(strokeLength([0, 0, 3, 4, 3, 14])).toBe(15);
  });
  it('is zero for a dot', () => {
    expect(strokeLength([5, 5, 5, 5])).toBe(0);
  });
});

describe('strokeCost', () => {
  it('charges a dot the minimum', () => {
    expect(strokeCost([5, 5, 5, 5])).toBe(DOT_INK);
  });
  it('charges a long line its length', () => {
    expect(strokeCost([0, 0, 100, 0])).toBe(100);
  });
});

describe('inkUsed', () => {
  it('sums the cost of every line, dots included', () => {
    expect(
      inkUsed([
        { c: '#000000', p: [0, 0, 100, 0] },
        { c: '#000000', p: [5, 5, 5, 5] },
      ])
    ).toBe(100 + DOT_INK);
  });
});

describe('parseEntry', () => {
  it('reads a valid two-line entry', () => {
    const drawing = [
      { c: '#ff0000', p: [0, 0, 255, 255] },
      { c: '#00ff00', p: [1, 2, 3, 4, 5, 6] },
    ];
    expect(parseEntry(JSON.stringify(drawing))).toEqual(drawing);
  });
  it('accepts a dot', () => {
    expect(
      parseEntry(JSON.stringify([{ c: '#000000', p: [7, 7, 7, 7] }]))
    ).toEqual([{ c: '#000000', p: [7, 7, 7, 7] }]);
  });

  const bad = (c: string, p: unknown) => JSON.stringify([{ c, p }]);
  it.each([
    ['a non-string', 42],
    ['invalid JSON', '[{'],
    ['a non-array', '{"c":"#000000","p":[0,0,1,1]}'],
    ['an uppercase color', bad('#FFAA00', [0, 0, 1, 1])],
    ['a short color', bad('#fa0', [0, 0, 1, 1])],
    ['an odd number of coordinates', bad('#000000', [0, 0, 1, 1, 2])],
    ['a single point', bad('#000000', [4, 4])],
    ['a coordinate of 256', bad('#000000', [0, 0, 256, 1])],
    ['a coordinate of -1', bad('#000000', [0, -1, 1, 1])],
    ['a fractional coordinate', bad('#000000', [0, 0.5, 1, 1])],
    [
      'too many lines',
      JSON.stringify(
        Array.from({ length: MAX_STROKES + 1 }, () => ({
          c: '#000000',
          p: [0, 0, 1, 1],
        }))
      ),
    ],
    [
      'too many points',
      JSON.stringify(
        Array.from({ length: 2 }, () => ({
          c: '#000000',
          p: Array.from({ length: MAX_POINTS + 2 }, () => 1),
        }))
      ),
    ],
    ['a string that is too long', 'x'.repeat(MAX_ENTRY_CHARS + 1)],
  ])('rejects %s', (_name, input) => {
    expect(parseEntry(input)).toBeNull();
  });
});

describe('toEntryString', () => {
  it('is compact JSON with keys in the order c, p', () => {
    expect(toEntryString([{ c: '#000000', p: [1, 2, 3, 4] }])).toBe(
      '[{"c":"#000000","p":[1,2,3,4]}]'
    );
  });
});

describe('validateEntry', () => {
  it('accepts an entry exactly at the budget', () => {
    expect(validateEntry(line(500), 500)).toEqual({ ok: true });
  });
  it('rejects one unit over the budget', () => {
    expect(validateEntry(line(501), 500)).toEqual({
      ok: false,
      reason: 'That drawing uses more line than today allows.',
    });
  });
  it('rejects below the minimum', () => {
    expect(validateEntry(line(MIN_INK - 1), 500)).toEqual({
      ok: false,
      reason: 'Draw a little more before you submit.',
    });
  });
  it('accepts exactly the minimum', () => {
    expect(validateEntry(line(MIN_INK), 500)).toEqual({ ok: true });
  });
  it('rejects an extra field on a line', () => {
    const s = JSON.stringify([{ c: '#000000', p: [0, 0, 60, 0], x: 1 }]);
    expect(validateEntry(s, 500)).toEqual({
      ok: false,
      reason: 'That drawing could not be read.',
    });
  });
  it('rejects spaces in the JSON', () => {
    const s = JSON.stringify([{ c: '#000000', p: [0, 0, 60, 0] }], null, 1);
    expect(validateEntry(s, 500)).toEqual({
      ok: false,
      reason: 'That drawing could not be read.',
    });
  });
  it('rejects a non-string', () => {
    expect(validateEntry(42, 500)).toEqual({
      ok: false,
      reason: 'That drawing could not be read.',
    });
  });
});
