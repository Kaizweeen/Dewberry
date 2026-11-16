export function nextStreak(
  prev: { streak: number; lastPlayed: number },
  day: number
): number {
  if (prev.streak > 0 && prev.lastPlayed === day) return prev.streak;
  if (prev.streak > 0 && prev.lastPlayed === day - 1) return prev.streak + 1;
  return 1;
}
