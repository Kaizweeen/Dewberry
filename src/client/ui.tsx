import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/** Inline styles that may set custom properties such as --fill. */
export type CssVars = CSSProperties & Record<`--${string}`, string | number>;

/** Lets an inline style object carry custom properties. */
export const vars = (style: CssVars): CssVars => style;

const STAGE_W = 375;
const STAGE_H = 596;

const fitScale = () =>
  Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);

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
  more: ['...#...', '....#..', '######.', '....#..', '...#...'],
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

/** The bush, the shadow, and Star, as in the start frame. */
export function PetScene() {
  return (
    <>
      <img
        src="/art/bush.png"
        alt=""
        style={{ left: 75, top: 62, width: 224, height: 80 }}
      />
      <img
        src="/art/shadow.png"
        alt=""
        style={{ left: 142, top: 134, width: 90, height: 27 }}
      />
      <img
        src="/art/star.png"
        alt="Your pet, Star"
        style={{ left: 133, top: 38, width: 108, height: 108 }}
      />
    </>
  );
}
