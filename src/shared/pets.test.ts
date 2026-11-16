import { describe, expect, it } from 'vitest';
import { cleanPetName, earnedRanks, isPetId, petSlots } from './pets';

describe('isPetId', () => {
  it('accepts the three pets only', () => {
    expect(['star', 'slime', 'angel'].every(isPetId)).toBe(true);
    expect(isPetId('dog')).toBe(false);
    expect(isPetId(3)).toBe(false);
  });
});

describe('petSlots', () => {
  it('gives 1, then 2 at best streak 7, then 3 at 30', () => {
    expect([0, 6, 7, 29, 30, 99].map(petSlots)).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe('earnedRanks', () => {
  it('gives rank 1 to a lone player', () => {
    expect(
      earnedRanks({ rank: 1, count: 1, itemRanks: [1], madeRank: 1 })
    ).toEqual([1]);
  });

  it('lets a maker keep an item outside the top 25 percent', () => {
    // 2 entries: cutoff is 1, so rank 2 is outside it but still owns its item.
    const day = { count: 2, itemRanks: [1, 2] };
    expect(earnedRanks({ ...day, rank: 2, madeRank: 2 })).toEqual([1, 2]);
    expect(earnedRanks({ ...day, rank: 2, madeRank: null })).toEqual([1]);
    expect(earnedRanks({ ...day, rank: 1, madeRank: 1 })).toEqual([1, 2]);
  });

  it('uses the top 25 percent cutoff for ranks 2 and 3', () => {
    const day = { count: 80, itemRanks: [1, 2, 3], madeRank: null };
    expect(earnedRanks({ ...day, rank: 20 })).toEqual([1, 2, 3]);
    expect(earnedRanks({ ...day, rank: 21 })).toEqual([1]);
  });

  it('treats a null rank as played but not placed', () => {
    expect(
      earnedRanks({
        rank: null,
        count: 80,
        itemRanks: [1, 2, 3],
        madeRank: null,
      })
    ).toEqual([1]);
  });

  it('gives nothing when the day has no items', () => {
    expect(
      earnedRanks({ rank: 1, count: 3, itemRanks: [], madeRank: null })
    ).toEqual([]);
  });

  it('sorts and never repeats', () => {
    expect(
      earnedRanks({ rank: 1, count: 80, itemRanks: [3, 1, 2, 2], madeRank: 3 })
    ).toEqual([1, 2, 3]);
  });
});

describe('cleanPetName', () => {
  it('trims and accepts letters, digits, and spaces up to 10', () => {
    expect(cleanPetName('  Mochi 2 ')).toBe('Mochi 2');
    expect(cleanPetName('abcdefghij')).toBe('abcdefghij');
  });

  it('refuses empty, long, symbol, and non-string input', () => {
    for (const v of ['', '   ', 'abcdefghijk', 'no!', 'a_b', 5, null])
      expect(cleanPetName(v)).toBeNull();
  });
});
