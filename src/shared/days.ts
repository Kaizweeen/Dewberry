import type { DayContent } from './content';

// Each day: a prompt, its category, four palette colors (hex, with names), and a pixel budget per color.
export const days: DayContent[] = [
  {
    prompt: 'a breakfast',
    category: 'food',
    colors: ['#fff4c2', '#f2b24c', '#d9534f', '#5a3a22'],
    colorNames: ['cream', 'orange', 'red', 'brown'],
    budget: [14, 12, 8, 6],
  },
  {
    prompt: 'a little house',
    category: 'scenery',
    colors: ['#ffffff', '#f7a8b8', '#c0553f', '#4a3b52'],
    colorNames: ['white', 'pink', 'brick', 'plum'],
    budget: [12, 12, 10, 6],
  },
  {
    prompt: 'a party hat',
    category: 'clothes',
    colors: ['#fff1a8', '#ff8fab', '#6ec6ff', '#3d348b'],
    colorNames: ['yellow', 'pink', 'sky blue', 'indigo'],
    budget: [10, 10, 8, 4],
  },
  {
    prompt: 'something sweet',
    category: 'food',
    colors: ['#ffffff', '#ffc2d1', '#e56b6f', '#6d3b47'],
    colorNames: ['white', 'light pink', 'coral', 'maroon'],
    budget: [12, 12, 8, 6],
  },
  {
    prompt: 'a tree',
    category: 'scenery',
    colors: ['#d8f5a2', '#74c365', '#2f7d4f', '#6b4226'],
    colorNames: ['lime', 'green', 'dark green', 'brown'],
    budget: [10, 14, 12, 6],
  },
  {
    prompt: 'a crown',
    category: 'clothes',
    colors: ['#fff7d6', '#ffd23f', '#ee964b', '#7a4419'],
    colorNames: ['cream', 'gold', 'orange', 'brown'],
    budget: [8, 12, 6, 4],
  },
  {
    prompt: 'a picnic snack',
    category: 'food',
    colors: ['#ffffff', '#ffe066', '#f25f5c', '#247ba0'],
    colorNames: ['white', 'yellow', 'red', 'blue'],
    budget: [12, 10, 8, 6],
  },
];
