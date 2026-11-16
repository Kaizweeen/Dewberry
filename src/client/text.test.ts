import { describe, expect, it } from 'vitest';
import { claimItemsShown, claimLines, petLabel } from './text';

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
