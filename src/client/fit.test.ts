import { describe, expect, it } from 'vitest';
import { NARROW, WIDE, fit } from './ui';

describe('which stage fits a window', () => {
  it('gives a desktop window the wide stage', () => {
    expect(fit(1280, 720).wide).toBe(true);
    expect(fit(900, 700).wide).toBe(true);
  });

  it('gives a phone, or a nearly square window, the tall stage', () => {
    expect(fit(390, 760).wide).toBe(false);
    expect(fit(800, 800).wide).toBe(false);
  });

  it('draws the stage as big as it fits', () => {
    expect(fit(1600, 1000).scale).toBe(2);
    expect(fit(NARROW.w * 2, NARROW.h * 2).scale).toBe(2);
  });

  it('reaches the meadow past the stage on whichever side has room', () => {
    // 1600 x 800 is wider than the wide stage's shape: the sides have room.
    const f = fit(1600, 800);
    expect(f.wide).toBe(true);
    expect(f.by).toBe(0);
    expect(f.bx).toBeCloseTo((1600 / (800 / WIDE.h) - WIDE.w) / 2);
    // A tall phone has room above and below.
    const p = fit(375, 800);
    expect(p.bx).toBe(0);
    expect(p.by).toBeCloseTo((800 - NARROW.h) / 2);
  });
});
