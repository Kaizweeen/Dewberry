import { describe, expect, it } from 'vitest';
import { countColors, validateEntry } from './entry';

const budget = [14, 10, 8, 4];
const pad = (s: string) => s + '0'.repeat(64 - s.length);

describe('validateEntry', () => {
  it('accepts a valid entry', () => {
    expect(validateEntry(pad('1123'), budget)).toEqual({ ok: true });
  });
  it('accepts an entry exactly at budget', () => {
    expect(validateEntry(pad('4444'), budget)).toEqual({ ok: true });
  });
  it('rejects a non-string', () => {
    expect(validateEntry(42, budget).ok).toBe(false);
  });
  it('rejects the wrong length', () => {
    expect(validateEntry('1111', budget).ok).toBe(false);
  });
  it('rejects an invalid character', () => {
    expect(validateEntry(pad('1159'), budget).ok).toBe(false);
  });
  it('rejects fewer than 4 painted pixels', () => {
    expect(validateEntry(pad('111'), budget).ok).toBe(false);
  });
  it('rejects a color over its budget', () => {
    expect(validateEntry(pad('44444'), budget).ok).toBe(false);
  });
});

describe('countColors', () => {
  it('counts cells per color', () => {
    expect(countColors(pad('112344'))).toEqual([2, 1, 1, 2]);
  });
});
