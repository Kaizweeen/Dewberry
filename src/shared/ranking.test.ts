import { describe, expect, it } from 'vitest';
import { rankEntries, topCutoff } from './ranking';

describe('rankEntries', () => {
  it('orders by hearts, highest first', () => {
    expect(
      rankEntries([
        { id: 'a', hearts: 1, time: 1 },
        { id: 'b', hearts: 5, time: 2 },
        { id: 'c', hearts: 3, time: 3 },
      ])
    ).toEqual(['b', 'c', 'a']);
  });
  it('breaks ties by earlier submission', () => {
    expect(
      rankEntries([
        { id: 'late', hearts: 2, time: 900 },
        { id: 'early', hearts: 2, time: 100 },
      ])
    ).toEqual(['early', 'late']);
  });
  it('does not mutate its input', () => {
    const input = [
      { id: 'a', hearts: 0, time: 2 },
      { id: 'b', hearts: 9, time: 1 },
    ];
    rankEntries(input);
    expect(input[0]?.id).toBe('a');
  });
});

describe('topCutoff', () => {
  it('rounds up', () => {
    expect(topCutoff(1)).toBe(1);
    expect(topCutoff(3)).toBe(1);
    expect(topCutoff(4)).toBe(1);
    expect(topCutoff(5)).toBe(2);
    expect(topCutoff(80)).toBe(20);
  });
  it('is zero for an empty day', () => {
    expect(topCutoff(0)).toBe(0);
  });
});
