import type { DayContent } from './content';

// Each day: a prompt, its category, and the day's line meter (paper units, shared by every color).
export const days: DayContent[] = [
  { prompt: 'a breakfast', category: 'food', budget: 1400 },
  { prompt: 'a little house', category: 'scenery', budget: 900 },
  { prompt: 'a party hat', category: 'clothes', budget: 1100 },
  { prompt: 'something sweet', category: 'food', budget: 1600 },
  { prompt: 'a tree', category: 'scenery', budget: 1000 },
  { prompt: 'a crown', category: 'clothes', budget: 800 },
  { prompt: 'a picnic snack', category: 'food', budget: 1300 },
];
