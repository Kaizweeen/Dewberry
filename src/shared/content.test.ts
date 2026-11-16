import { describe, expect, it } from 'vitest';
import { contentForDay, DAYS, luminance } from './content';

describe('daily content', () => {
  it('has at least 7 days', () => {
    expect(DAYS.length).toBeGreaterThanOrEqual(7);
  });

  it.each(DAYS.map((d, i) => [i + 1, d] as const))(
    'day %i is well formed',
    (_n, d) => {
      expect(d.prompt.trim().length).toBeGreaterThan(0);
      expect(['food', 'clothes', 'scenery']).toContain(d.category);
      expect(d.colors).toHaveLength(4);
      for (const c of d.colors) expect(c).toMatch(/^#[0-9a-f]{6}$/);
      expect(d.colorNames).toHaveLength(4);
      for (const n of d.colorNames) expect(n.trim().length).toBeGreaterThan(0);
      expect(d.budget).toHaveLength(4);
      for (const b of d.budget) expect(Number.isInteger(b) && b > 0).toBe(true);
      const total = d.budget.reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThanOrEqual(24);
      expect(total).toBeLessThanOrEqual(44);
    }
  );

  it.each(DAYS.map((d, i) => [i + 1, d] as const))(
    'day %i colors differ in lightness',
    (_n, d) => {
      const l = d.colors.map(luminance).sort((a, b) => a - b);
      for (let i = 1; i < l.length; i++) {
        expect((l[i] ?? 0) - (l[i - 1] ?? 0)).toBeGreaterThanOrEqual(0.05);
      }
    }
  );

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
