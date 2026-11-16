import { describe, expect, it } from 'vitest';
import { contentForDay, DAYS } from './content';

describe('daily content', () => {
  it('has at least 7 days', () => {
    expect(DAYS.length).toBeGreaterThanOrEqual(7);
  });

  it.each(DAYS.map((d, i) => [i + 1, d] as const))(
    'day %i is well formed',
    (_n, d) => {
      expect(d.prompt.trim().length).toBeGreaterThan(0);
      expect(['food', 'clothes', 'scenery']).toContain(d.category);
      expect(Number.isInteger(d.budget)).toBe(true);
      expect(d.budget).toBeGreaterThanOrEqual(700);
      expect(d.budget).toBeLessThanOrEqual(2000);
    }
  );

  it('never repeats the meter from the day before, including across the wrap', () => {
    DAYS.forEach((d, i) => {
      const before = DAYS[(i + DAYS.length - 1) % DAYS.length];
      expect(d.budget).not.toBe(before?.budget);
    });
  });

  it('gives every category at least twice in any seven days', () => {
    for (let start = 0; start < DAYS.length; start++) {
      const window = Array.from(
        { length: 7 },
        (_, i) => DAYS[(start + i) % DAYS.length]?.category
      );
      for (const c of ['food', 'clothes', 'scenery']) {
        expect(window.filter((w) => w === c).length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('looks up by day number and wraps', () => {
    expect(contentForDay(1)).toBe(DAYS[0]);
    expect(contentForDay(DAYS.length + 1)).toBe(DAYS[0]);
  });
});
