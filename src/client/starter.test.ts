// This test reads the art from disk, so it needs Node's types. Game code does not.
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STARTERS } from '../shared/starter';

// The starter items are drawn from their size in this table: the scene places
// an accessory by its art pixels, and the inventory fits the picture in a box.
describe('starter item art', () => {
  it.each(STARTERS)('$art.png is $w x $h art pixels', ({ art, w, h }) => {
    const png = readFileSync(`public/art/items/${art}.png`);
    expect({ w: png.readUInt32BE(16), h: png.readUInt32BE(20) }).toEqual({
      w,
      h,
    });
  });
});
