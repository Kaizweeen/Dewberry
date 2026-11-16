# Dewberry: design spec

Date: 2026-11-16
Status: approved 2026-11-16, then revised the same day at the owner's request (freehand lines in any color with one shared line meter replace the 8x8 pixel grid, see section 4). The revision awaits the owner's review.
Target: Reddit's Game of the Day Hackathon (Nov 11 to Dec 8, 2026), built on Devvit Web
Visual reference (read-only, owned by the project owner): https://www.figma.com/design/U5b3iV8Gsk5qgOEUDZAegB/Untitled?node-id=0-1

## 1. What it is

A daily drawing game for Reddit with a pet. Every day all players get the same prompt and the same line meter. Each player draws one freehand picture in any colors they like until the meter runs out, then spends five hearts on other players' drawings.

Each player keeps a pixel pet that lives in a sky and grass scene. Every prompt asks for something the pet can use (a food, something to wear, or a scenery object). The best drawings of the day become real items that players collect and place with their pets. The community makes the pet's world.

The game is called Dewberry, chosen by the owner on 2026-11-16. Earlier drafts used the working title Grout.

The game is a new original, not a port.

## 2. Goals and non-goals

Goals:
- A daily loop that takes two to four minutes: draw, heart, done.
- A reason to return the next day: claim what your pet earned.
- Every player's pet world grows, not only the winner's.
- Two clear layers: the scene, pets, and controls are chunky pixel art, and players' drawings are smooth freehand lines on paper. The contrast is the owner's choice.
- Works one-handed on a phone inside a Reddit post, with no scrolling during play.

Non-goals for v1:
- Posting a drawing as a comment
- Player-suggested prompts
- All-time leaderboards
- A currency or a shop
- Animation libraries
- Editing or deleting an entry after submit
- Unlockable backdrops (the scene uses the one sky and grass backdrop from the reference)

## 3. The daily loop

One post is one day. The day number is the count of daily posts since launch, starting at 1. A scheduled job creates a new post once every 24 hours at 12:00 UTC.

A post is **open** from its creation until the next post is created. While open it accepts entries and hearts. After that it is **closed** and read-only: it shows the top three and the viewer's own entry.

Screens, in order:

1. **Pet pick (first visit only).** The three pets side by side in the scene. One tap chooses, and the player lands on Start. No other setup.
2. **Start.** The player's pet in the scene, the game name, the date, today's prompt and category, the player's streak, the number of entries so far, and one Play button. If the player has unclaimed rewards, a single claim card shows first (section 7).
3. **Draw.** The paper, the line meter, the color picker, undo, erase, and Submit. Nothing else.
4. **Gallery.** Shown only after the player has submitted. Other players' drawings in pages of 12, with a heart button on each and a counter of hearts left.
5. **Result card.** The player's drawing, their streak, the pet in its fed state, hearts received so far, and the line "Come back tomorrow to see what your pet gets." One next step: a button that opens the post's comments.

The inventory (section 6) is reached by tapping the pet on the Start screen. It is never reachable from Draw.

Onboarding is contextual. There is no tutorial screen. On a player's first day, a single hint under the paper reads "Pick a color, then draw. The line runs out." It disappears after the first line.

## 4. Drawing

Revised twice on 2026-11-16 at the owner's request. Freehand lines replace the earlier 8x8 pixel grid: "I want it to be freehand but they have limited lines (like a line meter that runs out, then erase to regain the meter)", with "smooth lines, not pixels". The second revision replaced a meter per color with the owner's final choice: "I just want them to be able to choose their colors. Keep the line meter one for all", using a full color picker.

### The paper

A square sheet, 256 by 256 units. Players draw smooth freehand lines on it with a finger or a mouse. Every line has the same width (8 units) and round ends. The paper is off-white and is part of the finished drawing, so a drawing always reads the same wherever it is shown.

### The kit

One line meter per day, shared by every color: the total length of line a player can draw, measured in paper units. A meter of 256 is one full width of the paper. The meter's size changes every day, for example 1,400 one day and 900 the next. The meter is what makes the day's drawing a puzzle and keeps entries comparable.

Colors are free. The player picks any color at any time from a color picker built into the Draw screen: a square for how light and how strong the color is, and a strip for the hue. The colors already used in the drawing are shown as chips beside the picker, so a player can go back to an exact color with one tap.

Known ceiling: a very pale color is hard to see on the off-white paper. That is the player's call, the same as with real paper.

### Interaction

One tool is active at a time: the pen in the current color, or the eraser.

- Drag with the pen: draws a line in the current color. The meter drains by the length drawn. When the meter is empty the line stops and the meter pulses.
- Eraser: tapping or dragging across a line removes that whole line and gives its length back to the meter.
- Undo: reverts the last action, whether it drew a line or erased lines. The undo history lasts for the Draw session.

The drawing is saved as a draft in `localStorage` (wrapped in try/catch) on every change, keyed by day, so leaving and reopening the post restores it. If storage is unavailable the draft lives in memory only. A saved draft is validated before it is loaded.

Known ceiling: the eraser removes whole lines, not parts of lines. Rubbing out part of a line means splitting strokes. Add it if playtests ask for it.

### Submit

- Submit is disabled until at least 40 units of line are drawn in total.
- One entry per player per day. Entries are final.
- Submitting twice returns the existing entry and changes nothing (idempotent).

### Entry encoding

An entry is a JSON string: the lines in the order they were drawn, each as `{ "c": "#rrggbb", "p": [x0, y0, x1, y1, ...] }`. `c` is the line's color as a six-digit lowercase hex value. Coordinates are whole numbers from 0 to 255. The client records a point each time the pointer has moved at least 3 units, which keeps entries small.

The length of a line is the sum of the straight distances between its points. A tap leaves a dot, and every line costs at least 8 units, so dots are not free. One shared function computes the cost for both the client's meter and the server's check, so they never disagree.

The server validates every submitted entry:

- it is a string of at most 24,000 characters that parses to an array of lines in the shape above
- at most 200 lines and 3,000 points in total, and every line has at least 2 points
- every color is a `#` followed by six lowercase hex digits, and every coordinate is a whole number from 0 to 255
- the total cost of all lines is within the day's meter
- the total cost of all lines is at least 40 units
- the string is exactly the compact form the game itself produces, with no extra fields or spacing

Invalid entries are rejected with a 400 and never stored.

## 5. Judging

### Hearts

- Each player has 5 hearts per day.
- One heart per entry. A player cannot heart their own entry.
- Hearts are final. There is no un-heart.
- Only players who have submitted that day can heart.

### Gallery order

The gallery counters the advantage of early entries. The server keeps a view count per entry. Each gallery page returns the 12 entries with the lowest view counts that the viewer has not yet been served, with ties broken by a shuffle seeded from the viewer's user id. Serving a page increments the view count of each entry on it. The viewer's own entry and hidden entries are never served.

Empty state: if there are no other entries yet, the gallery says "You are the first today. Check back later to spend your hearts." No placeholder or seeded entries are ever shown.

### Ranking

When a day closes, entries are ranked by hearts, highest first. Ties are broken by earlier submission time. Hidden and removed entries are excluded.

### Finalization

When the scheduled job creates the new post it finalizes the day that just closed:

1. Compute the ranking.
2. Store the top three as items (section 6). If fewer than three entries exist, store only that many. If there are none, store nothing.
3. Store each player's rank and the entry count for that day.
4. Set the winner's user flair in the subreddit to "Day N winner".

## 6. The pet and the inventory

### The pets

Three hand-drawn pixel pets from the Figma reference: Star, Slime, and Angel. They are raster sprites made by the owner's team, not generated by code.

- The player picks one on their first visit.
- The other two unlock at streaks of 7 and 30 days, in the order the player chooses.
- A player switches between unlocked pets in the inventory.

The pet has two states:
- **Fed:** the player has submitted on the current open day.
- **Sleepy:** the player has not submitted yet today. Shown by a small pixel "z z" mark above the pet. If the team later draws sleepy sprites, they replace the mark with no other change.

The pet never dies, shrinks, or loses anything.

### Items

An item is a finalized top-three drawing from a past day. It stores the entry string (which carries its own colors), the day's category, its rank, and the maker's username. Items are identified by day and rank.

Three categories, set per day in the content file:
- **Food.** Shown in the bowl spot, on the grass in front of the pet.
- **Clothes.** Shown on the pet, positioned by a head anchor point defined per pet.
- **Scenery.** Objects that stand in the scene (a tree, a lamp, a little house). Two scenery spots: one behind the pet to its left, one in front to its right.

An item is shown as its drawing on a small paper card, sized to sit beside the pet. Since the 2026-11-16 revision, items are smooth line drawings in a pixel-art scene. The mismatch is accepted by the owner. How an item sits in the scene (card with a border, or lines only with no paper) is decided with mockups in the pets plan.

Known ceiling: a freehand drawing reads as clothing only when the prompt asks for something wearable and small (a hat, a bow, a crown). Clothes prompts are written with that in mind. If clothes still look wrong in playtesting, the category is retired from the rotation. That is a content change, not a data change.

### The inventory panel

The inventory follows the waffle panel in the reference: a grid of 4 by 3 slots, with four tabs along the top.

- Tabs: Food, Clothes, Scenery, Pets.
- Each slot shows one owned item. Tapping a slot places or removes it in the scene.
- Each item shows "made by u/name" when selected.
- More than 12 items in a tab: previous and next page controls.
- Empty tab: the slots stay empty with one line, "Play today to start your collection."

The four tabs are my reading of the four dot groups along the top of the panel in the reference. The owner confirms or corrects this at spec review.

## 7. Rewards and claiming

| What the player did | What they get |
|---|---|
| Submitted on a day | The pet is fed that day. The rank 1 item of that day, once finalized. |
| Finished in the top 25 percent that day | Also the rank 2 and rank 3 items. |
| Won the day | Their drawing is the rank 1 item with their name on it, plus the flair. |
| Reached a streak of 7, then 30 | Unlock one more pet each time. |

"Top 25 percent" means rank at or below `ceil(0.25 * entryCount)`. The maker of any top-three item always owns that item, even when their rank falls outside the top 25 percent (which happens on days with few entries).

Claiming is lazy. The server never loops over all players. When a player opens any post, the server checks for finalized days they played but have not claimed, adds the items they earned to their inventory, and returns a claim summary. The Start screen shows it as one card: "Yesterday you placed 14 of 80. Your pet got:" followed by the items. If several days are unclaimed they are combined into one card. Dismissing the card leads to the normal Start screen.

A player only collects items from days they played.

### Streaks

A streak is the number of consecutive day numbers with a submission, ending at the player's most recent played day. It resets to 1 when the player submits after missing a day. The server stores the current streak, the best streak, and the last played day.

## 8. Daily content

All content lives in one hand-authored file in the repo. Each day is:

```json
{
  "prompt": "a breakfast",
  "category": "food",
  "budget": 1400
}
```

`budget` is the day's line meter in paper units.

Rules for authoring:
- 40 days are authored before launch.
- Categories rotate so each appears at least twice in any seven days.
- The meter is between 700 and 2,000 units, and it differs from the day before.
- A day has no palette. Players choose their own colors.
- No content is generated at runtime.

When the day number passes the end of the file, the content index wraps around to the start. That is a known ceiling: the fix is to author more days.

## 9. Architecture

Built on Devvit Web, starting from the official React template.

### Client

React, TypeScript, Tailwind. The key units:

- `DrawingArt`: a pure component. Input: an entry string and a size. Output: the drawing as round-capped SVG lines on paper, at any size. Used by the paper, gallery thumbnails, the result card, inventory slots, and scene items.
- `Paper`: the editor. Owns drawing, the meter, the color picker, erasing, undo, and draft saving. Uses `DrawingArt` for display.
- `PetScene`: composes the backdrop image, the pet sprite, scenery items, the bowl, and the wearable.
- `Inventory`: the waffle panel with tabs, slots, and paging.
- Screens: Pet pick, Start, Draw, Gallery, Result, and the closed-day view.

### Art assets

The backdrop, the inventory panel, and the three pets are raster images exported from the owner's Figma file at their native pixel resolution and scaled up in the browser with `image-rendering: pixelated`, at whole-number multiples only so pixels stay square and sharp. The Figma file is never edited by this project.

### Shared

A `shared` module used by both client and server, with no dependencies:

- Entry validate and count
- Budget counting
- Ranking and the top 25 percent cutoff
- Streak calculation
- Content lookup by day number

### Server

Seven endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /api/day` | The post's day: prompt, line meter, open or closed, entry count, the viewer's entry, streak, hearts left, pet, and any claim summary. Performs the lazy claim. |
| `POST /api/entry` | Validate and store the viewer's entry, update streak and fed state. |
| `GET /api/gallery` | Next page of 12 entries for the viewer. |
| `POST /api/heart` | Spend one heart on an entry. |
| `GET /api/results` | For a closed day: top three and the viewer's rank. |
| `GET /api/pet` | The viewer's pet, unlocked pets, placed items, and inventory. |
| `POST /api/pet/update` | Choose or switch pet, place or remove an owned item. |

The server takes the user identity and post from the Devvit request context, never from the request body.

### Storage (Devvit Redis)

| Key | Type | Holds |
|---|---|---|
| `day:current` | string | The current day number |
| `post:{postId}` | string | The day number for that post |
| `entry:{day}` | hash | userId to entry string |
| `entrytime:{day}` | sorted set | userId scored by submission time |
| `hearts:{day}` | sorted set | userId scored by hearts received |
| `views:{day}` | sorted set | userId scored by view count |
| `hearted:{day}:{userId}` | set | Entries this viewer has hearted |
| `served:{day}:{userId}` | set | Entries this viewer has been served |
| `hidden:{day}` | set | Entries hidden by reports or removed by mods |
| `reports:{day}:{entryUserId}` | set | Users who reported this entry |
| `final:{day}` | hash | Entry count and each player's rank |
| `item:{day}:{rank}` | hash | Entry string, colors, category, maker, revoked flag |
| `player:{userId}` | hash | Streak, best streak, last played day, last claimed day, current pet, placed item ids |
| `played:{userId}` | set | Day numbers the player submitted on |
| `items:{userId}` | set | Item ids the player owns |
| `pets:{userId}` | set | Pets the player has unlocked |

### Scheduler

One daily job at 12:00 UTC: finalize the closing day, increment `day:current`, create the new post, and record `post:{postId}`. The job is safe to run twice: if a post for the next day already exists it does nothing.

### Analytics

Devvit Journeys events are emitted for game start (the first line drawn) and game completion (a successful submit), using the event names the Journeys docs require.

## 10. Moderation

Pixels can still be arranged into something offensive, and winning items are shown to everyone.

- Every gallery entry has a report button. An entry reported by 3 distinct players is hidden from the gallery and from ranking until a moderator acts.
- Moderator menu actions: remove an entry, restore an entry, revoke an item.
- A revoked item stays in the data but renders as an empty slot everywhere, and no longer appears in inventories.

## 11. Errors and edge cases

- **Submit fails:** the canvas stays as it is, the draft is kept, and a retry button appears. Nothing is lost.
- **Heart fails:** the heart is shown immediately and reverted with a short message if the server rejects it.
- **Out of hearts or already hearted:** the server refuses, and the client disables the button so the case is not normally reachable.
- **Day closes while the player is drawing:** submit returns "This day has ended" with a link to today's post. The draft is discarded.
- **Closed post opened:** shows results only, with a link to the current post.
- **First ever day:** no previous day exists, so there is no claim card and no top three.
- **A day with fewer than three entries:** only that many items exist. Players who played still get the rank 1 item if there is one.
- **Loading and failure states:** every screen has a skeleton state and a plain retry state.

## 12. Accessibility and layout

- **Layouts.** The reference shows one desktop layout: the pet on the left of the scene, the inventory panel on the right. Most Reddit play is on phones, so there is also a phone layout that the reference does not show: the scene with the pet on top, and the inventory panel or the canvas below it. The phone layout is shown to the owner before it is built.
- The Draw screen fits the Reddit post viewport on a phone with no scrolling. The paper is as wide as the screen allows, about 340px.
- The meter has an accessible name with how much is left ("Line left: 49 percent"). The color picker's two controls work with arrow keys. A finished drawing has an accessible name that says whose it is and what the prompt was. Since players choose their own colors, a drawing may rely on color differences that some viewers cannot see. That is a limit of free color choice.
- Freehand drawing needs a pointer. A keyboard-only player can use every other control but cannot draw. This is a stated limit of the freehand design.
- Motion respects `prefers-reduced-motion`.
- Text meets 4.5:1 contrast against the surface it sits on.

## 13. Visual direction

The look is set by the owner's Figma file and is not open for reinterpretation:

- Chunky, low-resolution pixel art with soft, bright colors.
- A scene of pale blue sky with white clouds over light green grass.
- Small rounded pets with dot eyes and pink cheeks.
- A cream and caramel inventory panel that looks like a waffle, with square slots, dot tabs along the top, and a zigzag trim along the bottom.

The reference covers the scene, the pets, and the inventory panel. It does not show type, buttons, the Draw canvas, the Gallery, the Result card, the claim card, or a phone layout. Those are designed in the same pixel language (panel shapes and colors taken from the waffle panel, a pixel typeface that stays readable at small sizes) and shown to the owner for approval before they are built. `PRODUCT.md` and `DESIGN.md` record the Figma file as the visual authority.

## 14. Testing

Vitest unit tests on the shared module and server rules:

- Entry validation: every rejection case, and total line length against the day's meter
- Ranking, tie-breaks, and the top 25 percent cutoff at small entry counts
- Streak calculation across consecutive, same, and missed days, and pet unlocks at 7 and 30
- Claim logic: which items a player gets, and that claiming twice gives nothing new
- Gallery ordering: lowest views first, own and hidden entries excluded, no entry served twice
- Content file: every day has a prompt, a category, and a meter in range that differs from the day before

Then a full playtest in a private test subreddit on both the phone app and desktop, including a forced day rollover.

## 15. To verify before the code that depends on it

Devvit details below come from memory, because the docs site could not be read while writing this spec. Each is confirmed against the installed template and docs first:

- Project layout and `devvit.json` fields
- Redis commands available (hashes, sets, sorted sets)
- Scheduler cron syntax, and creating a post from a scheduled job
- Setting user flair from the app
- Moderator menu actions
- The Journeys API and required event names
- `localStorage` availability inside the post webview
- Post viewport sizes on mobile and desktop
- How the server reads the current user and post

Art details to confirm with the owner's files:

- The native pixel resolution of the backdrop, panel, and pet sprites, so everything scales by whole numbers
- A head anchor point for each pet
- Whether the four dot groups on the panel are tabs

If any of these is not as assumed, the affected section of this spec is revised before building it.

## 16. Build order

1. Scaffold, shared module with tests, and the `PixelArt` component
2. Draw screen and submit, playable in a test subreddit
3. Gallery, hearts, and the result card
4. Scheduler, finalization, closed-day view, and flair
5. Art export from Figma, the pet scene, pet pick, items, claiming, and the inventory
6. Reports and moderator actions
7. Journeys events, content authoring to 40 days, polish, and the submission video

Cut order if time runs short: winner flair first, then the second scenery spot, then the keyboard controls for the canvas.

## 17. What the owner does

- Signing in to Reddit, running `devvit login`, creating the test subreddit, and submitting to Devpost
- Owning the Figma file and all pet, backdrop, and panel art
- Deciding the final name
