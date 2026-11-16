import { describe, expect, it } from 'vitest';
import { nextStreak } from './streak';

describe('nextStreak', () => {
  it('starts a new player at 1', () => {
    expect(nextStreak({ streak: 0, lastPlayed: 0 }, 5)).toBe(1);
  });
  it('starts at 1 on the very first day', () => {
    expect(nextStreak({ streak: 0, lastPlayed: 0 }, 1)).toBe(1);
  });
  it('adds one on a consecutive day', () => {
    expect(nextStreak({ streak: 3, lastPlayed: 6 }, 7)).toBe(4);
  });
  it('stays the same on the same day', () => {
    expect(nextStreak({ streak: 3, lastPlayed: 7 }, 7)).toBe(3);
  });
  it('resets to 1 after a missed day', () => {
    expect(nextStreak({ streak: 9, lastPlayed: 5 }, 7)).toBe(1);
  });
});
