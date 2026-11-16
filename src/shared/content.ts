import { days } from './days';

export type Category = 'food' | 'clothes' | 'scenery';
export type DayContent = {
  prompt: string;
  category: Category;
  colors: string[];
  colorNames: string[];
  budget: number[];
};

export const DAYS: DayContent[] = days;

export function contentForDay(day: number): DayContent {
  // ponytail: wraps when authored days run out. The fix is authoring more days.
  const content = DAYS[(day - 1) % DAYS.length];
  if (!content) throw new Error(`No content for day ${day}`);
  return content;
}

export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}
