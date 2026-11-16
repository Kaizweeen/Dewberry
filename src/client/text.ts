/** "Streak: 3 days", "Streak: 1 day", or "No streak yet". */
export function streakText(streak: number): string {
  if (streak <= 0) return 'No streak yet';
  return `Streak: ${streak} ${streak === 1 ? 'day' : 'days'}`;
}

/** "27 drawings" or "1 drawing". */
export function drawingsText(count: number): string {
  return `${count} ${count === 1 ? 'drawing' : 'drawings'}`;
}

/** "Star", from a pet id. */
export function petLabel(pet: string): string {
  return pet.charAt(0).toUpperCase() + pet.slice(1);
}

const DAY_LINES = 3;
const ITEMS_SHOWN = 6;

/** One line per day for the claim card: "Day 3: you placed 14 of 80." At most three, then "and 2 more days". */
export function claimLines(
  days: { day: number; rank: number | null; count: number }[]
): string[] {
  const lines = days
    .slice(0, DAY_LINES)
    .map((d) =>
      d.rank === null
        ? `Day ${d.day}: ${drawingsText(d.count)}.`
        : `Day ${d.day}: you placed ${d.rank} of ${d.count}.`
    );
  const more = days.length - DAY_LINES;
  if (more > 0) lines.push(`and ${more} more ${more === 1 ? 'day' : 'days'}`);
  return lines;
}

/** How many items the claim card shows, and the "and 2 more" line for the rest (or null). */
export function claimItemsShown(total: number): {
  shown: number;
  more: string | null;
} {
  const shown = Math.min(total, ITEMS_SHOWN);
  return {
    shown,
    more: total > shown ? `and ${total - shown} more` : null,
  };
}

/** Pockets on one page of the waffle panel. */
export const PER_PAGE = 12;

/** How many pages `total` items need. An empty tab still has one page. */
export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PER_PAGE));
}

/** The items on page `page` (counting from 0). A page out of range is pulled back in. */
export function pageSlice<T>(items: T[], page: number): T[] {
  const p = Math.min(Math.max(page, 0), pageCount(items.length) - 1);
  return items.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
}

/** Why a locked pet cannot be picked yet, from how many pets the streak allows. */
export function unlockLine(slots: number): string {
  return slots >= 2
    ? 'Reach a 30 day streak to unlock another pet.'
    : 'Reach a 7 day streak to unlock another pet.';
}

/** The comments page of a post, from its t3_ id. */
export function postUrl(postId: string): string {
  return `https://www.reddit.com/comments/${postId.replace(/^t3_/, '')}`;
}
