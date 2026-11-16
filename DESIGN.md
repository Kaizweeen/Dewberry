---
name: Dewberry
description: A daily drawing game inside a Reddit post, set in a pixel meadow.
colors:
  sky: "#53daff"
  plate: "#f1f1f1"
  line: "#838383"
  line-hi: "#c3c3c3"
  ink: "#565656"
  cream: "#ffe59a"
  caramel: "#e3a75c"
  caramel-hi: "#f1c67b"
  caramel-lo: "#c8873d"
  toast: "#6b4420"
  heart: "#ff5e55"
  paper: "#fbf7ec"
  disabled-fill: "#e4e4e4"
  disabled-text: "#8d8d8d"
  meter-track: "#cfcfcf"
typography:
  display:
    fontFamily: "Silkscreen, monospace"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: "44px"
  headline:
    fontFamily: "Silkscreen, monospace"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: "36px"
  title:
    fontFamily: "Silkscreen, monospace"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: "30px"
  body:
    fontFamily: "Silkscreen, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "22px"
  label:
    fontFamily: "Silkscreen, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "14px"
rounded:
  none: "0px"
spacing:
  unit: "4px"
  gutter: "12px"
components:
  plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px"
  button:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
  button-hover:
    backgroundColor: "#ffffff"
  button-primary:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.toast}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
  button-primary-hover:
    backgroundColor: "#fff0bd"
  button-disabled:
    backgroundColor: "{colors.disabled-fill}"
    textColor: "{colors.disabled-text}"
  tab:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.toast}"
    typography: "{typography.body}"
    padding: "4px 16px"
  sheet:
    backgroundColor: "{colors.paper}"
    size: "256px"
---

# Design System: Dewberry

## Overview

**Creative North Star: "Paper in a pixel meadow"**

The world is the owner's pixel art: a flat blue sky, a grass horizon, a pet, and a waffle panel in caramel and cream. Everything the game adds on top is built from the same pixel grammar: grey plates with stepped corners, a pixel typeface in capitals, and icons drawn on a 7 pixel grid. The scene stays quiet so that it reads as a place, not a menu.

The one thing that is not pixel art is the player's drawing. Drawings are smooth, round lines on a sheet of warm paper, and they are shown unaltered wherever they appear. The contrast is deliberate: the game is pixels, the player's hand is not.

Screens are single views with no scrolling. Each one has one job and one cream button that moves the player forward.

**Key Characteristics:**

- The owner's art is used as drawn and scaled by whole numbers, with crisp pixels.
- One unit (4px) sets every border, corner step, and gap.
- Grey for structure, cream and caramel for the next action, red only for hearts.
- Drawings sit on paper, large, never restyled.
- No scrolling, no gradients in the interface, no soft shadows.

## Colors

A flat sky and neutral grey plates carry the interface. Warm waffle colors mark what the player should press next.

### Primary

- **Waffle Cream** (`cream`): the fill of the primary button and of the day tab. One primary button per screen.
- **Toasted Brown** (`toast`): text on cream, and the focus ring on cream controls.
- **Caramel** (`caramel`, `caramel-hi`, `caramel-lo`): the light and dark edges of cream controls, and the pockets of the waffle panel that hold drawings.

### Secondary

- **Heart Red** (`heart`): filled hearts, the heart badge on a drawing, and the brief flash of the meter when the line runs out. Nothing else is red.

### Neutral

- **Sky** (`sky`): the page background behind and around the scene.
- **Plate Grey** (`plate`): the fill of panels and ordinary buttons.
- **Edge Grey** (`line`, `line-hi`): the dark and light edges of plates, empty hearts, and large display text.
- **Ink** (`ink`): body text, icons, the meter fill, and focus rings on grey controls.
- **Paper** (`paper`): the drawing sheet and the backing of every drawing shown.
- **Disabled** (`disabled-fill`, `disabled-text`): a button that cannot be pressed yet.
- **Meter Track** (`meter-track`): the empty part of the line meter.

### Named Rules

**The Player's Colors Rule.** Any color outside this list belongs to a player's drawing. The interface never borrows a color from the picker, and never tints a drawing.

**The One Cream Button Rule.** Cream means "this is the way forward". A screen has one cream button. Everything else is grey.

## Typography

**Display Font:** Silkscreen (with monospace fallback)
**Body Font:** Silkscreen (with monospace fallback)

**Character:** One pixel typeface at one weight, always in capitals. Hierarchy comes from size and from the plate the text sits on, never from weight or italics.

### Hierarchy

- **Display** (400, 40px, 44px line): the game's name in the feed view.
- **Headline** (400, 32px, 36px line): the day's prompt, screen headings, and the main button of a screen.
- **Title** (400, 24px, 30px line): other buttons.
- **Body** (400, 16px, 22px line): supporting lines, counts, the day tab.
- **Label** (400, 12px, 14px line): small notes. This is the smallest size allowed.

### Named Rules

**The On A Plate Rule.** Text never sits directly on the sky or the grass. It sits on a plate or a tab, so contrast does not depend on the scene behind it.

## Layout

The game is designed once, on a stage of 375 x 596. That is the measured size of Reddit's expanded view. The stage is scaled by the smaller of the two fit ratios and centered, and the sky fills whatever is left around it. There are no breakpoints.

- Positions are absolute within the stage, on the 4px unit.
- The side gutter is 12px. Full width plates are 351px wide.
- The day tab sits at the top right, 12px from both edges.
- The grass horizon is high on the Start and Result screens, where the pet stands, and low on the others.
- The drawing sheet is 256 x 256 and is never scaled by a fraction on the Draw screen.
- The inline view in the feed is fluid, because its size is not known. It shows the pet, the name, and one Play button.

## Elevation & Depth

The system is flat. Depth comes from two toned edges on each plate (a light edge at the top and left, a dark edge at the bottom and right) and from layering in the scene: sky, grass, bush, shadow, pet, then plates.

- **Waffle pocket:** an inner caramel highlight and a cream outline, in whole pixels, hold a drawing in the panel.
- **Heart badge:** a hard white outline, 2px on each side, keeps the badge readable over any drawing.

### Named Rules

**The No Blur Rule.** No blurred shadows and no glows. Every edge is a hard step.

## Shapes

Corners are stepped, not rounded: each corner is cut in two 4px steps, the same steps as the owner's nameplate and buttons. There are no radii anywhere. Icons are drawn as pixel maps on a grid of 7 columns. Pixel art is always rendered with crisp pixels.

Drawings are the exception: lines are 8 units wide on the 256 sheet with round ends and round joins.

## Components

### Plates

The basic container. A grey fill with a 4px toned edge and stepped corners. Plates hold text, groups of controls, and the drawing sheet.

### Buttons

- **Shape:** a plate with stepped corners, text centered, usually Title size.
- **Ordinary:** grey fill, ink text, an even dark edge. Hover turns the fill white.
- **Primary:** cream fill, toast text, caramel edges. Hover lightens the cream.
- **Pressed:** the button moves down one unit (4px).
- **Toggled on** (pen, eraser): white fill with an ink edge.
- **Focus:** an inner ring one unit thick, ink on grey and toast on cream.
- **Disabled:** pale grey fill and grey text, no press movement.
- **Art buttons:** the owner's drawn home button is used as an image, brightens slightly on hover, and takes an ink outline on focus.

### Day tab

A small cream plate at the top right with the day number. It is a label, not a control.

### Drawing sheet

A 256 x 256 sheet of paper inside a plate. Crosshair cursor, no touch scrolling. Only the primary pointer draws.

### Line meter

A flat bar that drains as the player draws. The big meter on the Draw screen is 12px tall with an ink fill on a grey track. When the line runs out it flashes red twice in hard steps, and a text notice says the same thing.

### Color picker

A square for brightness and strength, a strip for hue, and square knobs with a white border and an ink outline. Below it, chips of the colors already used, as small plates. The chosen chip lifts one unit and takes an ink edge.

### Drawings in the gallery

Each drawing sits on paper in a pocket of the waffle panel. Hover lifts it 4px. Focus draws a toast outline. A hearted drawing gets a heart badge at its top right corner.

### Hearts

Five pixel hearts in a row: red when left to give, an empty grey outline when spent. The row always shows all five.

## Do's and Don'ts

### Do:

- **Do** build every new control from a plate: stepped corners, a 4px edge, a flat fill.
- **Do** keep the 4px unit for borders, gaps, and press movement.
- **Do** show drawings on paper, as large as the screen allows, exactly as drawn.
- **Do** put text on a plate or a tab.
- **Do** say a state in words as well as in color or motion.
- **Do** respect reduced motion: with it on, nothing animates.

### Don't:

- **Don't** use rounded corners, blurred shadows, or gradients in the interface. The color picker's own surfaces are the only gradients.
- **Don't** redraw, recolor, or smooth the owner's art.
- **Don't** use red for anything but hearts and the empty meter flash.
- **Don't** add a second cream button to a screen.
- **Don't** make a screen scroll. If it does not fit in 375 x 596, it has too much on it.
- **Don't** go below 12px text.
