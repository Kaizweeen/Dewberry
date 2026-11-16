import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { PetId } from '../shared/pets';
import type { Item, Placed } from '../shared/types';
import { DrawingArt } from './draw/DrawingArt';

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
        <img className="sky" src="/art/sky.png" alt="" />
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

/** Native sizes of the pet sprites, in art pixels. */
export const PET_PX = {
  star: { w: 9, h: 9 },
  slime: { w: 11, h: 7 },
  angel: { w: 10, h: 11 },
} as const satisfies Record<PetId, { w: number; h: number }>;

const SCENE_X = 187;
const SCENE_FEET = 146;
const SCENE_SCALE = 12;

// Clothes: `y` is the bottom edge of the clothes square, which is centered on
// SCENE_X. `z` is the top left corner of the sleepy mark (44 x 20). All of it
// stays inside the stage and clear of the day tab (left of x 259, below y 42).
const ON_HEAD = {
  star: { y: 62, size: 56, z: { x: 219, y: 46 } },
  slime: { y: 74, size: 56, z: { x: 219, y: 44 } },
  angel: { y: 52, size: 48, z: { x: 75, y: 18 } },
} as const satisfies Record<
  PetId,
  { y: number; size: number; z: { x: number; y: number } }
>;

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
      <DrawingArt
        entry={item.entry}
        label={`${item.category} by u/${item.maker}`}
      />
    </span>
  );
}

/** The bush, the shadow, the pet at 12 times its size, and what is placed with it. */
export function PetScene(props: {
  pet: PetId;
  fed: boolean;
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
  const alt = `Your pet, ${name}${props.fed ? '' : ', is sleepy'}`;
  const sprite = {
    left: SCENE_X - w / 2,
    top: SCENE_FEET - h,
    width: w,
    height: h,
  };
  const shadowScale = pet === 'star' ? 9 : 11;
  const shadowW = 10 * shadowScale;
  return (
    <>
      <img
        src="/art/bush.png"
        alt=""
        style={{ left: 75, top: 62, width: 224, height: 80 }}
      />
      {placed.sceneryBack !== null && (
        <Card item={placed.sceneryBack} x={24} y={64} size={64} />
      )}
      <img
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
        <img src={`/art/${pet}.png`} alt={alt} style={sprite} />
      ) : (
        <button
          className="artbtn"
          style={sprite}
          aria-label="Open your pet's things"
          aria-describedby="pet-state"
          onClick={props.onPet}
        >
          <img src={`/art/${pet}.png`} alt="" />
          <span id="pet-state" hidden>
            {alt}
          </span>
        </button>
      )}
      {placed.food !== null && (
        <Card item={placed.food} x={240} y={124} size={40} />
      )}
      {placed.clothes !== null && (
        <span
          className="art card"
          style={{
            left: SCENE_X - head.size / 2,
            top: head.y - head.size,
            width: head.size,
            height: head.size,
          }}
        >
          <DrawingArt
            bare
            entry={placed.clothes.entry}
            label={`${placed.clothes.category} by u/${placed.clothes.maker}`}
          />
        </span>
      )}
      {!props.fed && (
        <span
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
    </>
  );
}
