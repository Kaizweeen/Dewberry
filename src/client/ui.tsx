import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { FULL_MAX } from '../shared/pets';
import type { PetId } from '../shared/pets';
import { STARTERS } from '../shared/starter';
import type { Item, Placed } from '../shared/types';
import { DrawingArt } from './draw/DrawingArt';
import { itemLabel } from './text';

/** Inline styles that may set custom properties such as --fill. */
export type CssVars = CSSProperties & Record<`--${string}`, string | number>;

/** Lets an inline style object carry custom properties. */
export const vars = (style: CssVars): CssVars => style;

const STAGE_W = 375;
const STAGE_H = 596;

const fitScale = () => {
  const scale = Math.min(
    window.innerWidth / STAGE_W,
    window.innerHeight / STAGE_H
  );
  return scale > 0 ? scale : 1;
};

/** The sky fills the viewport. The game sits in a 375 x 596 box, scaled to fit and centered. */
export function Stage(props: {
  horizon?: 'low' | 'high';
  children: ReactNode;
}) {
  const [scale, setScale] = useState(fitScale);
  useEffect(() => {
    const onResize = () => setScale(fitScale());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return (
    <div className="viewport">
      <div
        className="stage"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <img className="sky drift" src="/art/sky.png" alt="" />
        <img
          className={props.horizon === 'high' ? 'grass high' : 'grass'}
          src="/art/grass.png"
          alt=""
        />
        {props.children}
      </div>
    </div>
  );
}

const ICONS = {
  heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
  heartEmpty: [
    '.##.##.',
    '#..#..#',
    '#.....#',
    '.#...#.',
    '..#.#..',
    '...#...',
  ],
  undo: [
    '..#....',
    '.#.....',
    '######.',
    '.#....#',
    '..#...#',
    '......#',
    '...###.',
  ],
  erase: [
    '...###.',
    '..#..##',
    '.#..#.#',
    '#..#.#.',
    '#.#.#..',
    '.##....',
    '#######',
  ],
  check: ['......#', '.....##', '#...##.', '##.##..', '.###...', '..#....'],
  berry: [
    '....#..',
    '..###..',
    '.#####.',
    '#######',
    '#######',
    '.#####.',
    '..###..',
  ],
  berryEmpty: [
    '....#..',
    '..###..',
    '.#...#.',
    '#.....#',
    '#.....#',
    '.#...#.',
    '..###..',
  ],
  more: ['...#...', '....#..', '######.', '....#..', '...#...'],
  sleep: [
    '#####.#####',
    '...#.....#.',
    '..#.....#..',
    '.#.....#...',
    '#####.#####',
  ],
  comment: [
    '.#####.',
    '#.....#',
    '#.....#',
    '#.....#',
    '.#####.',
    '..#....',
    '.#.....',
  ],
} as const;

export type IconName = keyof typeof ICONS;

const ICON_FILL: Partial<Record<IconName, string>> = {
  heart: 'var(--heart)',
  heartEmpty: 'var(--line)',
  berry: 'var(--berry)',
  berryEmpty: 'var(--line)',
};

/** A pixel icon. Without a size it fills its parent's width. */
export function Icon(props: {
  name: IconName;
  width?: number;
  height?: number;
}) {
  const rows = ICONS[props.name];
  const fill = ICON_FILL[props.name] ?? 'currentColor';
  const cells: ReactNode[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '#') {
        cells.push(
          <rect
            key={`${x},${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill={fill}
          />
        );
      }
    });
  });
  return (
    <span
      className="icon"
      style={{
        ...(props.width === undefined ? {} : { width: props.width }),
        ...(props.height === undefined ? {} : { height: props.height }),
      }}
    >
      <svg
        viewBox={`0 0 ${rows[0].length} ${rows.length}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {cells}
      </svg>
    </span>
  );
}

/** Five hearts, `left` of them filled. */
export function Hearts(props: { left: number }) {
  return (
    <div
      className="hearts"
      role="img"
      aria-label={`${props.left} of 5 hearts left`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon
          key={i}
          name={i < props.left ? 'heart' : 'heartEmpty'}
          width={28}
          height={24}
        />
      ))}
    </div>
  );
}

/** The pet's fullness: three dewberries, `full` of them filled. `size` is one berry, in pixels. */
export function Fullness(props: { full: number; name: string; size: number }) {
  return (
    <div
      className="berries"
      role="img"
      aria-label={`${props.name}: ${props.full} of ${FULL_MAX} full`}
    >
      {Array.from({ length: FULL_MAX }, (_, i) => (
        <Icon
          key={i}
          name={i < props.full ? 'berry' : 'berryEmpty'}
          width={props.size}
          height={props.size}
        />
      ))}
    </div>
  );
}

/** Sizes of one pet frame, in art pixels. */
export const PET_PX = {
  star: { w: 9, h: 9 },
  slime: { w: 11, h: 7 },
  angel: { w: 10, h: 9 },
} as const satisfies Record<PetId, { w: number; h: number }>;

/**
 * Each pet is one strip, `/art/<pet>-fed.png`: STRIP_FRAMES frames side by
 * side, drawn at STRIP_SUB strip pixels per art pixel (the blink's eyes are
 * half an art pixel tall). The frames are the eating timeline. Frame 12 is the
 * blink and frame 13 is the pet at rest (see .sprite in index.css).
 */
export const STRIP_FRAMES = 14;
export const STRIP_SUB = 2;

export type PetMood = 'idle' | 'asleep' | 'eating' | 'still' | 'open';

/**
 * A pet at `scale` screen pixels per art pixel. idle blinks, asleep keeps its
 * eyes shut, eating plays the eating timeline once, still does nothing, open
 * holds its mouth wide open (food is coming).
 * Without a label it is decoration.
 */
export function Pet(props: {
  pet: PetId;
  scale: number;
  mood?: PetMood;
  /** Rises and settles, like breathing. */
  bob?: boolean;
  label?: string;
  style?: CSSProperties;
  onAnimationEnd?: () => void;
}) {
  const px = PET_PX[props.pet];
  const mood = props.mood ?? 'idle';
  const bob =
    props.bob === true ? (mood === 'asleep' ? ' bob slow' : ' bob') : '';
  return (
    <span
      className={`sprite ${props.pet} ${mood}${bob}`}
      style={vars({
        '--fw': `${px.w * props.scale}px`,
        height: px.h * props.scale,
        ...props.style,
      })}
      {...(props.label === undefined
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': props.label })}
      {...(props.onAnimationEnd === undefined
        ? {}
        : { onAnimationEnd: props.onAnimationEnd })}
    />
  );
}

/** The owner's ladybug, walking along the grass at height `top`. Decoration. */
export function Ladybug(props: { top: number | string }) {
  return (
    <span className="bugpath" style={{ top: props.top }} aria-hidden="true">
      <img src="/art/ladybug.png" alt="" />
    </span>
  );
}

const SCENE_X = 187;
const SCENE_FEET = 146;
const SCENE_SCALE = 12;

// Clothes: `y` is the bottom edge of the clothes square, which is centered on
// SCENE_X. `z` is the top left corner of the sleepy mark (44 x 20). All of it
// stays inside the stage and clear of the day tab (left of x 259, below y 42).
const ON_HEAD = {
  star: { y: 62, size: 56, z: { x: 219, y: 46 } },
  slime: { y: 74, size: 56, z: { x: 219, y: 44 } },
  angel: { y: 66, size: 48, z: { x: 79, y: 44 } },
} as const satisfies Record<
  PetId,
  { y: number; size: number; z: { x: number; y: number } }
>;

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** An item's picture: the player's drawing, or the owner's pixel art for a starter item. */
export function ItemArt(props: { item: Item; bare?: boolean; label?: string }) {
  const { item } = props;
  if (item.art !== undefined)
    return (
      <img
        className="starter"
        src={`/art/items/${item.art}.png`}
        alt={props.label ?? ''}
      />
    );
  return (
    <DrawingArt
      entry={item.entry}
      {...(props.label === undefined ? {} : { label: props.label })}
      {...(props.bare === true ? { bare: true } : {})}
    />
  );
}

// The owner's accessories are drawn finer than the pets: one of their art pixels
// is WEAR_SCALE screen pixels, two thirds of a pet's.
const WEAR_SCALE = 8;

// Where each sits on each pet, in the pet's art pixels from its top left. `x` is
// the middle of the accessory and `y` its top edge, so a negative `y` rises above
// the pet. The sunglasses cover the eyes.
type Spot = { x: number; y: number };
const WEAR = {
  star: {
    fedora: { x: 4.5, y: -1.5 },
    band: { x: 4.5, y: 1.5 },
    sunglasses: { x: 4.5, y: 3.8 },
  },
  slime: {
    fedora: { x: 5.5, y: -1.4 },
    band: { x: 5.5, y: 1.7 },
    sunglasses: { x: 5.5, y: 3.8 },
  },
  angel: {
    fedora: { x: 5, y: -1.8 },
    band: { x: 5, y: 2.5 },
    sunglasses: { x: 4.5, y: 5.8 },
  },
} as const satisfies Record<PetId, Record<string, Spot>>;

/** A placed item's drawing on a paper card. */
function Card(props: { item: Item; x: number; y: number; size: number }) {
  const { item } = props;
  return (
    <span
      className="art card framed paper"
      style={{
        left: props.x,
        top: props.y,
        width: props.size,
        height: props.size,
      }}
    >
      <ItemArt item={item} label={itemLabel(item)} />
    </span>
  );
}

/** The bush, the shadow, the pet at 12 times its size, and what is placed with it. */
export function PetScene(props: {
  pet: PetId;
  fullness: number;
  placed: Placed;
  name?: string;
  onPet?: () => void;
}) {
  const { pet, placed } = props;
  const px = PET_PX[pet];
  const head = ON_HEAD[pet];
  const w = px.w * SCENE_SCALE;
  const h = px.h * SCENE_SCALE;
  const name =
    props.name !== undefined && props.name !== '' ? props.name : capital(pet);
  const hungry = props.fullness <= 0;
  const alt = `Your pet, ${name}${hungry ? ', is hungry and sleepy' : ''}`;
  const sprite = {
    position: 'absolute',
    left: SCENE_X - w / 2,
    top: SCENE_FEET - h,
  } as const;
  const mood = hungry ? 'asleep' : 'idle';
  const breath = hungry ? 'bob slow' : 'bob';
  // The owner's accessories are worn on the pet. A drawing is a card above its head.
  const art = placed.clothes?.art;
  const spot: Spot | undefined =
    art === undefined
      ? undefined
      : (WEAR[pet] as Record<string, Spot | undefined>)[art];
  const size = STARTERS.find((s) => s.art === art);
  const worn = spot && size ? { ...spot, w: size.w, h: size.h } : null;
  const shadowScale = pet === 'star' ? 9 : 11;
  const shadowW = 10 * shadowScale;
  return (
    <>
      <img
        className="rustle"
        src="/art/bush.png"
        alt=""
        style={{ left: 75, top: 62, width: 224, height: 80 }}
      />
      {placed.sceneryBack !== null && (
        <Card item={placed.sceneryBack} x={24} y={64} size={64} />
      )}
      <img
        className={`shade ${breath}`}
        src="/art/shadow.png"
        alt=""
        style={{
          left: SCENE_X - shadowW / 2,
          top: 134,
          width: shadowW,
          height: 3 * shadowScale,
        }}
      />
      {props.onPet === undefined ? (
        <Pet
          pet={pet}
          scale={SCENE_SCALE}
          mood={mood}
          bob
          label={alt}
          style={sprite}
        />
      ) : (
        <button
          className="artbtn"
          style={{ ...sprite, width: w, height: h }}
          aria-label="Open your pet's things"
          aria-describedby="pet-state"
          onClick={props.onPet}
        >
          <Pet pet={pet} scale={SCENE_SCALE} mood={mood} bob />
          <span id="pet-state" hidden>
            {alt}
          </span>
        </button>
      )}
      {placed.clothes !== null && worn === null && (
        <span
          className={`art card ${breath}`}
          style={{
            left: SCENE_X - head.size / 2,
            top: head.y - head.size,
            width: head.size,
            height: head.size,
          }}
        >
          <ItemArt
            bare
            item={placed.clothes}
            label={itemLabel(placed.clothes)}
          />
        </span>
      )}
      {placed.clothes !== null && worn !== null && (
        <span
          className={`card ${breath}`}
          style={{
            left:
              sprite.left + worn.x * SCENE_SCALE - (worn.w * WEAR_SCALE) / 2,
            top: sprite.top + worn.y * SCENE_SCALE,
            width: worn.w * WEAR_SCALE,
            height: worn.h * WEAR_SCALE,
          }}
        >
          <ItemArt item={placed.clothes} label={itemLabel(placed.clothes)} />
        </span>
      )}
      {hungry && (
        <span
          className="bob slow"
          style={{
            position: 'absolute',
            left: head.z.x,
            top: head.z.y,
            width: 44,
            height: 20,
          }}
        >
          <Icon name="sleep" width={44} height={20} />
        </span>
      )}
      {placed.sceneryFront !== null && (
        <Card item={placed.sceneryFront} x={296} y={72} size={64} />
      )}
      <Ladybug top={144} />
    </>
  );
}
