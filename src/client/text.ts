/** "Streak: 3 days", "Streak: 1 day", or "No streak yet". */
export function streakText(streak: number): string {
  if (streak <= 0) return 'No streak yet';
  return `Streak: ${streak} ${streak === 1 ? 'day' : 'days'}`;
}

/** "27 drawings" or "1 drawing". */
export function drawingsText(count: number): string {
  return `${count} ${count === 1 ? 'drawing' : 'drawings'}`;
}

/** The comments page of a post, from its t3_ id. */
export function postUrl(postId: string): string {
  return `https://www.reddit.com/comments/${postId.replace(/^t3_/, '')}`;
}
