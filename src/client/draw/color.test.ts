import { describe, it, expect } from 'vitest';
import { hexToHsv, hsvToHex } from './color';

describe('hexToHsv', () => {
  it('reads the primaries', () => {
    expect(hexToHsv('#ff0000')).toEqual({ h: 0, s: 1, v: 1 });
    expect(hexToHsv('#00ff00')).toEqual({ h: 120, s: 1, v: 1 });
    expect(hexToHsv('#0000ff')).toEqual({ h: 240, s: 1, v: 1 });
  });

  it('reads white, black and gray', () => {
    expect(hexToHsv('#ffffff')).toEqual({ h: 0, s: 0, v: 1 });
    expect(hexToHsv('#000000')).toEqual({ h: 0, s: 0, v: 0 });
    const gray = hexToHsv('#808080');
    expect(gray?.s).toBe(0);
    expect(gray?.h).toBe(0);
    expect(gray?.v).toBeCloseTo(0.502, 3);
  });

  it('rejects malformed input', () => {
    for (const bad of ['red', '#ABCDEF', '#abc', 'abcdef', '#abcdeg', '']) {
      expect(hexToHsv(bad)).toBeNull();
    }
  });
});

describe('hsvToHex', () => {
  it('writes known colors', () => {
    expect(hsvToHex(0, 1, 1)).toBe('#ff0000');
    expect(hsvToHex(120, 1, 1)).toBe('#00ff00');
    expect(hsvToHex(240, 1, 1)).toBe('#0000ff');
    expect(hsvToHex(0, 0, 1)).toBe('#ffffff');
    expect(hsvToHex(0, 0, 0)).toBe('#000000');
  });

  it('round-trips a handful of colors', () => {
    for (const hex of [
      '#333333',
      '#fbf7ec',
      '#e8590c',
      '#1c7ed6',
      '#9c36b5',
      '#2b8a3e',
      '#abcdef',
      '#010203',
    ]) {
      const hsv = hexToHsv(hex);
      expect(hsv).not.toBeNull();
      if (hsv) expect(hsvToHex(hsv.h, hsv.s, hsv.v)).toBe(hex);
    }
  });

  it('clamps s and v and wraps h', () => {
    expect(hsvToHex(0, 5, 5)).toBe('#ff0000');
    expect(hsvToHex(0, -1, -1)).toBe('#000000');
    expect(hsvToHex(360, 1, 1)).toBe('#ff0000');
    expect(hsvToHex(480, 1, 1)).toBe('#00ff00');
    expect(hsvToHex(-120, 1, 1)).toBe('#0000ff');
  });
});
