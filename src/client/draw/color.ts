/** h: 0..360, s: 0..1, v: 0..1. Returns '#rrggbb' lowercase. s and v outside their range are clamped, h wraps. */
export function hsvToHex(h: number, s: number, v: number): string {
  const fin = (n: number): number => (Number.isFinite(n) ? n : 0);
  const hue = ((fin(h) % 360) + 360) % 360;
  const sat = Math.min(1, Math.max(0, fin(s)));
  const val = Math.min(1, Math.max(0, fin(v)));
  const channel = (n: number): string => {
    const k = (n + hue / 60) % 6;
    const f = val - val * sat * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(f * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(5)}${channel(3)}${channel(1)}`;
}

/** Returns null unless hex matches /^#[0-9a-f]{6}$/. h is 0 for grays. */
export function hexToHsv(
  hex: string
): { h: number; s: number; v: number } | null {
  if (!/^#[0-9a-f]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}
