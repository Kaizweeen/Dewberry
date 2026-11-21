/**
 * The owner's main menu, in art pixels. The canvas is 148 x 98. The logo and
 * the two buttons form one column in its middle: the logo, then DRAW starting
 * 34 rows below the logo's top, then UR PET 3 rows under DRAW.
 */
export const MENU = {
  w: 148,
  h: 98,
  skyW: 149,
  landH: 58,
  logoW: 116,
  logoH: 43,
  btnW: 41,
  btnH: 11,
  btnTop: 34,
  btnGap: 3,
} as const;

/** Screen pixels per art pixel, for the backdrop, the logo, and the buttons. */
export type MenuUnits = { bg: number; fg: number; btn: number };

/**
 * Whole-number scales for a viewport, so every art pixel stays square.
 * `bg` covers the viewport with the backdrop. `fg` is the largest scale at
 * which the logo fits, never larger than the backdrop's. `btn` is at least 4,
 * which keeps a button 44 pixels tall on a narrow phone.
 */
export function menuUnits(vw: number, vh: number): MenuUnits {
  const bg = Math.max(1, Math.ceil(Math.max(vw / MENU.w, vh / MENU.h)));
  // The logo with 2 art pixels of air each side, and the column with 9 above and below.
  const fit = Math.floor(Math.min(vw / (MENU.logoW + 4), vh / 78));
  const fg = Math.max(2, Math.min(bg, fit));
  return { bg, fg, btn: Math.max(fg, 4) };
}
