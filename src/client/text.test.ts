import { describe, expect, it } from 'vitest';
import {
  claimItemsShown,
  claimLines,
  pageCount,
  pageSlice,
  petLabel,
  unlockLine,
} from './text';

describe('pageCount', () => {
  it('keeps one page for an empty tab', () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(12)).toBe(1);
  });

  it('adds a page after twelve items', () => {
    expect(pageCount(13)).toBe(2);
    expect(pageCount(24)).toBe(2);
    expect(pageCount(25)).toBe(3);
  });
});

describe('pageSlice', () => {
  const items = Array.from({ length: 30 }, (_, i) => i);

  it('cuts twelve at a time', () => {
    expect(pageSlice(items, 0)).toEqual(items.slice(0, 12));
    expect(pageSlice(items, 2)).toEqual(items.slice(24));
  });

  it('pulls a page out of range back in', () => {
    expect(pageSlice(items, 9)).toEqual(items.slice(24));
    expect(pageSlice(items, -1)).toEqual(items.slice(0, 12));
    expect(pageSlice([], 3)).toEqual([]);
  });
});

describe('unlockLine', () => {
  it('names the 7 day streak while only one slot is open', () => {
    expect(unlockLine(1)).toBe('Reach a 7 day streak to unlock another pet.');
  });

  it('names the 30 day streak after that', () => {
    expect(unlockLine(2)).toBe('Reach a 30 day streak to unlock another pet.');
  });
});

describe('petLabel', () => {
  it('capitalizes the pet id', () => {
    expect(petLabel('star')).toBe('Star');
    expect(petLabel('angel')).toBe('Angel');
  });
});

describe('claimLines', () => {
  it('says where the player placed', () => {
    expect(claimLines([{ day: 3, rank: 14, count: 80 }])).toEqual([
      'Day 3: you placed 14 of 80.',
    ]);
  });

  it('says the drawing count when the rank is null', () => {
    expect(claimLines([{ day: 3, rank: null, count: 80 }])).toEqual([
      'Day 3: 80 drawings.',
    ]);
    expect(claimLines([{ day: 4, rank: null, count: 1 }])).toEqual([
      'Day 4: 1 drawing.',
    ]);
  });

  it('shows three days as three lines', () => {
    const days = [1, 2, 3].map((day) => ({ day, rank: 1, count: 5 }));
    expect(claimLines(days)).toHaveLength(3);
  });

  it('folds the rest into one line', () => {
    const days = [1, 2, 3, 4, 5].map((day) => ({ day, rank: 1, count: 5 }));
    const lines = claimLines(days);
    expect(lines).toHaveLength(4);
    expect(lines[3]).toBe('and 2 more days');
  });

  it('uses the singular for one more day', () => {
    const days = [1, 2, 3, 4].map((day) => ({ day, rank: 1, count: 5 }));
    expect(claimLines(days)[3]).toBe('and 1 more day');
  });
});

describe('claimItemsShown', () => {
  it('shows all items up to six', () => {
    expect(claimItemsShown(0)).toEqual({ shown: 0, more: null });
    expect(claimItemsShown(6)).toEqual({ shown: 6, more: null });
  });

  it('shows six and counts the rest', () => {
    expect(claimItemsShown(9)).toEqual({ shown: 6, more: 'and 3 more' });
  });
});
