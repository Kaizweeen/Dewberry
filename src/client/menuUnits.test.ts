import { describe, expect, it } from 'vitest';
import { MENU, menuUnits } from './menuUnits';

const SIZES: [string, number, number][] = [
  ['a desktop window', 1280, 720],
  ['a large desktop', 1920, 1080],
  ['a phone upright', 375, 667],
  ['a phone on its side', 667, 375],
  ["Reddit's expanded view", 375, 596],
  ['a wide, short window', 1024, 400],
  ['a small feed card', 343, 320],
];

describe('menuUnits', () => {
  it('matches the owner composition on a desktop: one scale for everything', () => {
    expect(menuUnits(1280, 720)).toEqual({ bg: 9, fg: 9, btn: 9 });
  });

  it('shrinks the logo and keeps the buttons tappable on a phone', () => {
    expect(menuUnits(375, 667)).toEqual({ bg: 7, fg: 3, btn: 4 });
  });

  it.each(SIZES)('fits %s (%i x %i)', (_name, vw, vh) => {
    const { bg, fg, btn } = menuUnits(vw, vh);
    // The backdrop leaves no gap.
    expect(bg * MENU.w).toBeGreaterThanOrEqual(vw);
    expect(bg * MENU.h).toBeGreaterThanOrEqual(vh);
    // The logo and the buttons stay on screen.
    expect(fg * MENU.logoW).toBeLessThanOrEqual(vw);
    expect(btn * MENU.btnW).toBeLessThanOrEqual(vw);
    const column = MENU.btnTop * fg + (2 * MENU.btnH + MENU.btnGap) * btn;
    expect(column).toBeLessThanOrEqual(vh);
    // A button is never shorter than 44 pixels.
    expect(btn * MENU.btnH).toBeGreaterThanOrEqual(44);
  });
});
