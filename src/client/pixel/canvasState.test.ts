import { describe, expect, it } from 'vitest';
import {
  canvasReducer,
  emptyCanvas,
  fromEntry,
  remaining,
  toEntry,
} from './canvasState';

const budget = [2, 2, 2, 2];
const reduce = canvasReducer(budget);
const paint = (index: number, color: number) =>
  ({ type: 'paint', index, color }) as const;

describe('canvasReducer', () => {
  it('paints an empty cell', () => {
    const s = reduce(emptyCanvas(), paint(0, 1));
    expect(s.cells[0]).toBe(1);
    expect(remaining(s.cells, budget)).toEqual([1, 2, 2, 2]);
  });

  it('refuses to paint past the budget', () => {
    let s = emptyCanvas();
    s = reduce(s, paint(0, 1));
    s = reduce(s, paint(1, 1));
    s = reduce(s, paint(2, 1));
    expect(s.cells[2]).toBe(0);
  });

  it('refunds the old color when repainting', () => {
    let s = reduce(emptyCanvas(), paint(0, 1));
    s = reduce(s, paint(0, 2));
    expect(remaining(s.cells, budget)).toEqual([2, 1, 2, 2]);
  });

  it('erases and refunds with color 0', () => {
    let s = reduce(emptyCanvas(), paint(0, 1));
    s = reduce(s, paint(0, 0));
    expect(s.cells[0]).toBe(0);
    expect(remaining(s.cells, budget)).toEqual([2, 2, 2, 2]);
  });

  it('ignores an index outside the grid', () => {
    const start = emptyCanvas();
    expect(reduce(start, paint(64, 1))).toBe(start);
  });

  it('undoes a whole stroke at once', () => {
    let s = reduce(emptyCanvas(), { type: 'strokeStart' });
    s = reduce(s, paint(0, 1));
    s = reduce(s, paint(1, 1));
    s = reduce(s, { type: 'undo' });
    expect(s.cells.slice(0, 2)).toEqual([0, 0]);
  });

  it('skips strokes that changed nothing when undoing', () => {
    let s = reduce(emptyCanvas(), { type: 'strokeStart' });
    s = reduce(s, paint(0, 1));
    s = reduce(s, { type: 'strokeStart' });
    s = reduce(s, { type: 'undo' });
    expect(s.cells[0]).toBe(0);
  });

  it('does nothing when there is nothing to undo', () => {
    const start = emptyCanvas();
    expect(reduce(start, { type: 'undo' }).cells).toEqual(start.cells);
  });
});

describe('entry conversion', () => {
  it('round trips', () => {
    const entry = '1234' + '0'.repeat(60);
    expect(toEntry(fromEntry(entry))).toBe(entry);
  });
});
