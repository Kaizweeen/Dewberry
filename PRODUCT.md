# Product

## Platform

web

## Users

Redditors who meet the day's post in a subreddit feed and play inside the post, on reddit.com or in the Reddit phone app. They are casual players with a couple of minutes, not pixel artists. A second audience is the judging panel of Reddit's Game of the Day Hackathon (Devpost, November 11 to December 8, 2026).

## Product Purpose

A daily drawing game for redditors. Draw the day's prompt freehand in about two minutes, in any colors, with one line meter that runs out, give five hearts to other players' drawings, and the day's top three drawings become food, clothes, and scenery for players' pets. (Confirmed by the owner on 2026-11-16. The owner changed drawing from an 8x8 pixel grid to freehand lines the same day, then chose free colors with one shared line meter.)

Success is a player coming back tomorrow: to see how their drawing placed, to collect what their pet earned, and to draw again.

## Positioning

The rewards are made by the players. Each day's winning drawings become the items every pet can own, so the community's own art fills the game over time. A fixed kit (one line meter, one square sheet of paper) keeps every entry comparable and quick. Colors are the player's own choice. The meter's size changes every day.

## Operating Context

- Runs as a Devvit Web app inside a Reddit post. One post per day, created at 12:00 UTC. A day's post stays open until the next one is created.
- The post shows a light inline view in the feed and an expanded view for play.
- Players are identified by their Reddit account. Logged-out viewers cannot play.
- Design order chosen by the owner: desktop first, matching the Figma frames, then adapted to the phone.

## Capabilities and Constraints

- Drawing is freehand: smooth lines on paper, in any color from a built-in color picker. One line meter drains as the player draws, whatever the color. The eraser removes a whole line and gives its length back.
- One final entry per player per day. A drawing needs a minimum amount of line. Entries cannot be edited after submitting.
- Five hearts per player per day, one per entry, never for your own entry, only after submitting.
- Ranking is by hearts, then by earlier submission. The top 25 percent and the top three matter for rewards.
- Three pets: Star, Slime, Angel. The player picks one at the start. The others unlock at streaks of 7 and 30 days.
- No content is generated at runtime. Prompts and palettes are hand authored. No placeholder or seeded entries are ever shown. The one exception is the owner's starter kit (below), which is the owner's own art and is labeled as such.
- Built so far: the whole daily loop (Draw, Gallery, Result, and the closed day), played by the owner in a Reddit test subreddit on 2026-11-16. Also built, and played through in the local test copy only: the pet pick, pet names, rewards and the claim card, the waffle inventory with its four tabs, the pet's home page, and feeding. Not built yet: reporting and moderation tools, winner flair, and the full 40 days of prompts. The pet system, the home page, and feeding have not been played on Reddit yet, and nothing has been tried in the Reddit phone app.
- Animation pass, approved by the owner on 2026-11-18 and tried in the local test copy only: the pets blink, breathe, sleep when hungry, and all three eat when fed. The sky drifts, the bush rustles, a ladybug walks the grass, and the result page shows the player's drawing on the owner's easel, redrawing itself. The owner's ladybug art was exported with soft edges and is used as exported until a crisp copy replaces it.
- Starter kit, chosen by the owner on 2026-11-20 and tried in the local test copy only: every player owns the owner's pixel art from day one, beside the winning drawings they earn. Foods: cherry, cream, leaf, peanut, watermelon (3 servings each, like any food). Accessories: band, fedora, sunglasses, worn on the pet one at a time in the clothes slot. They are labeled "from the Dewberry kit" and sort after earned items. The accessories are drawn at two thirds of a pet's pixel size and placed by hand on each pet. Not decided: whether a used-up starter food should come back.
- Main menu, asked for by the owner on 2026-11-18 with their own art, and tried in the local test copy only: an open day now starts at a full-window menu with two buttons, DRAW and UR PET. It replaces the pet's home as the landing page, and the pet's home is one tap away. It is laid out for desktop and phone. The other screens are not laid out for desktop yet: they sit in a centered column.
- Feeding, decided by the owner on 2026-11-17: food is a reward from the drawing competition and gets used up. Each food has 3 servings. The pet's fullness runs from 0 to 3, drops by 1 each new day, and rises by 1 per serving. Drawing does not feed the pet. A hungry pet only looks sleepy: it never loses anything. The numbers (3 servings, 1 a day) are a first setting and have not been tuned with real players.
- The pet's home is the landing page of every open day (owner's choice, 2026-11-17): the pet, its fullness, today's prompt, one main button that follows the day, and Feed and Inventory.
- The game is called Dewberry (chosen by the owner on 2026-11-16).
- Decided by the owner on 2026-11-16: the four dot groups on the inventory panel are the tabs Food, Clothes, Scenery, Pets. Everyone who drew on a day collects that day's winning drawing, and the top 25 percent also collect second and third place.

## Brand Commitments

- The owner's Figma file is the visual authority and is never edited: https://www.figma.com/design/U5b3iV8Gsk5qgOEUDZAegB/Untitled?node-id=0-1
- The pets, sky, grass, and waffle inventory panel are the owner's own pixel art and are used as drawn.
- Players' drawings are smooth freehand lines, not pixel art. The contrast with the pixel scene is the owner's choice.
- No em dashes or en dashes in any copy.

## Evidence on Hand

- Three desktop frames in the Figma file (1440 x 1024), one per pet, each with the sky, grass, a pet, and the inventory panel.
- The owner's raster art for Star, Slime, Angel, the backdrop, and the panel.
- The Figma file shows no type, buttons, or other screens. Those are designed in this project and need the owner's approval.
- There are no players, entries, testimonials, or numbers yet. None may be invented.

## Product Principles

1. Two minutes, every day. Nothing between opening the post and drawing should cost more than a tap.
2. The drawing is the hero. Players' drawings are shown large, on their paper, and unaltered.
3. Honesty over polish. Never fake activity, entries, or results. Say plainly what is closed, missing, or still to come.
4. Fair by construction. Everyone gets the same kit, the same number of hearts, and an equal chance to be seen.
5. The pet is the reason to return. Rewards are visible on the pet, not buried in a list.

## Accessibility & Inclusion

- Players choose their own colors, so a drawing may rely on color differences that some viewers cannot see, and very pale lines are hard to see on the paper. These are known limits of free color choice.
- Drawing must work by touch and mouse. Freehand drawing needs a pointer, so a keyboard-only player can use every other control but cannot draw. This is a known limit.
- Text and controls must meet WCAG AA contrast over the pastel backdrop.
