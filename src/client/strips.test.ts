// This test reads the art from disk, so it needs Node's types. Game code does not.
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PETS } from '../shared/pets';
import { PET_PX, STRIP_FRAMES, STRIP_SUB } from './ui';

// The .sprite rules in index.css step through STRIP_FRAMES equal frames. A strip
// of any other size would show slices of two frames at once.
describe('pet strips', () => {
  it.each(PETS)('%s-fed.png is %s frames of the pet size', (pet) => {
    const png = readFileSync(`public/art/${pet}-fed.png`);
    const px = PET_PX[pet];
    expect({ w: png.readUInt32BE(16), h: png.readUInt32BE(20) }).toEqual({
      w: STRIP_FRAMES * STRIP_SUB * px.w,
      h: STRIP_SUB * px.h,
    });
  });
});
