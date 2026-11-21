import type { Item } from './types';

/**
 * The owner's own pixel art, owned by every player from day one. Foods are
 * eaten (SERVINGS each, like any food) and accessories are worn. The pictures
 * are `/art/items/<art>.png`, one image pixel per art pixel.
 */
export const STARTERS = [
  { art: 'cherry', name: 'Cherry', category: 'food', w: 9, h: 10 },
  { art: 'cream', name: 'Cream', category: 'food', w: 9, h: 10 },
  { art: 'leaf', name: 'Leaf', category: 'food', w: 11, h: 11 },
  { art: 'peanut', name: 'Peanut', category: 'food', w: 9, h: 11 },
  { art: 'watermelon', name: 'Watermelon', category: 'food', w: 12, h: 6 },
  { art: 'band', name: 'Band', category: 'clothes', w: 10, h: 3 },
  { art: 'fedora', name: 'Fedora', category: 'clothes', w: 11, h: 5 },
  { art: 'sunglasses', name: 'Sunglasses', category: 'clothes', w: 8, h: 2 },
] as const;

export type StarterArt = (typeof STARTERS)[number]['art'];

/** A starter's item. Day 0 sorts it after every item a player earned. */
export const starterItems: Item[] = STARTERS.map((s, i) => ({
  id: `starter:${s.art}`,
  day: 0,
  rank: i + 1,
  category: s.category,
  entry: '',
  maker: '',
  art: s.art,
  name: s.name,
}));

export const starterItem = (id: string): Item | null =>
  starterItems.find((i) => i.id === id) ?? null;
