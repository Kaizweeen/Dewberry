export type Scored = { id: string; hearts: number; time: number };

export function rankEntries(entries: Scored[]): string[] {
  return [...entries]
    .sort((a, b) => b.hearts - a.hearts || a.time - b.time)
    .map((e) => e.id);
}

export function topCutoff(count: number): number {
  return Math.ceil(0.25 * count);
}
