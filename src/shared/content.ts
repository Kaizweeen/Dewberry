import { days } from './days';

export type Category = 'food' | 'clothes' | 'scenery';
export type DayContent = {
  prompt: string;
  category: Category;
  budget: number;
};

export const DAYS: DayContent[] = days;

export function contentForDay(day: number): DayContent {
  // ponytail: wraps when authored days run out. The fix is authoring more days.
  const content = DAYS[(day - 1) % DAYS.length];
  if (!content) throw new Error(`No content for day ${day}`);
  return content;
}
