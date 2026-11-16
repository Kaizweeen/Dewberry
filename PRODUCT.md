# Product

## Platform

web

## Users

Redditors who meet the day's post in a subreddit feed and play inside the post, on reddit.com or in the Reddit phone app. They are casual players with a couple of minutes, not pixel artists. A second audience is the judging panel of Reddit's Game of the Day Hackathon (Devpost, November 11 to December 8, 2026).

## Product Purpose

A daily pixel drawing game for redditors. Draw the day's prompt on an 8x8 grid in about two minutes, give five hearts to other players' drawings, and the day's top three drawings become food, clothes, and scenery for players' pets. (Confirmed by the owner on 2026-11-16.)

Success is a player coming back tomorrow: to see how their drawing placed, to collect what their pet earned, and to draw again.

## Positioning

The rewards are made by the players. Each day's winning drawings become the items every pet can own, so the community's own art fills the game over time. A fixed kit (four colors, a pixel budget per color, one 8x8 canvas) keeps every entry comparable and quick.

## Operating Context

- Runs as a Devvit Web app inside a Reddit post. One post per day, created at 12:00 UTC. A day's post stays open until the next one is created.
- The post shows a light inline view in the feed and an expanded view for play.
- Players are identified by their Reddit account. Logged-out viewers cannot play.
- Design order chosen by the owner: desktop first, matching the Figma frames, then adapted to the phone.

## Capabilities and Constraints

- One final entry per player per day. Minimum 4 painted pixels. Entries cannot be edited after submitting.
- Five hearts per player per day, one per entry, never for your own entry, only after submitting.
- Ranking is by hearts, then by earlier submission. The top 25 percent and the top three matter for rewards.
- Three pets: Star, Slime, Angel. The player picks one at the start. The others unlock at streaks of 7 and 30 days.
- No content is generated at runtime. Prompts and palettes are hand authored. No placeholder or seeded entries are ever shown.
- Built so far: the daily loop's rules and server. Not built yet: screens, pets, inventory, moderation tools.
- Undecided: the game's final name. "Grout" is a working title from an earlier idea and will be replaced.
- Undecided: whether the four dot groups on the inventory panel are tabs (the working assumption is Food, Clothes, Scenery, Pets).

## Brand Commitments

- The owner's Figma file is the visual authority and is never edited: https://www.figma.com/design/U5b3iV8Gsk5qgOEUDZAegB/Untitled?node-id=0-1
- The pets, sky, grass, and waffle inventory panel are the owner's own pixel art and are used as drawn.
- No em dashes or en dashes in any copy.

## Evidence on Hand

- Three desktop frames in the Figma file (1440 x 1024), one per pet, each with the sky, grass, a pet, and the inventory panel.
- The owner's raster art for Star, Slime, Angel, the backdrop, and the panel.
- The Figma file shows no type, buttons, or other screens. Those are designed in this project and need the owner's approval.
- There are no players, entries, testimonials, or numbers yet. None may be invented.

## Product Principles

1. Two minutes, every day. Nothing between opening the post and drawing should cost more than a tap.
2. The drawing is the hero. Players' pixel art is shown large, crisp, and unaltered.
3. Honesty over polish. Never fake activity, entries, or results. Say plainly what is closed, missing, or still to come.
4. Fair by construction. Everyone gets the same kit, the same number of hearts, and an equal chance to be seen.
5. The pet is the reason to return. Rewards are visible on the pet, not buried in a list.

## Accessibility & Inclusion

- A day's four colors must be distinguishable by lightness alone, and each has a name for screen readers.
- The canvas must be usable by touch and mouse. Keyboard control of the canvas is planned.
- Text and controls must meet WCAG AA contrast over the pastel backdrop.
