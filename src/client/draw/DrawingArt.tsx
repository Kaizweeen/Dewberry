import { SIZE, STROKE_WIDTH, parseEntry } from '../../shared/entry';
import type { Drawing } from '../../shared/entry';

export const PAPER = '#fbf7ec';

// A replay takes this long in all, and no single line takes longer than REPLAY_LINE_MS.
const REPLAY_MS = 2400;
const REPLAY_LINE_MS = 400;

/**
 * The paper and its lines, as the children of an svg with viewBox 0 0 SIZE SIZE.
 * With `replay` the lines draw themselves once, in the order they were drawn.
 */
export function Lines(props: {
  drawing: Drawing;
  bare?: boolean;
  replay?: boolean;
}) {
  const each = Math.min(
    REPLAY_LINE_MS,
    REPLAY_MS / Math.max(1, props.drawing.length)
  );
  return (
    <>
      {props.bare !== true && <rect width={SIZE} height={SIZE} fill={PAPER} />}
      {props.drawing.map((s, i) => {
        const pts: string[] = [];
        for (let j = 0; j + 1 < s.p.length; j += 2) {
          pts.push(`${s.p[j]},${s.p[j + 1]}`);
        }
        // A tap is a line with no length: it has nothing to trace, so it only appears.
        const dot = pts.every((p) => p === pts[0]);
        return (
          <polyline
            key={i}
            points={pts.join(' ')}
            fill="none"
            stroke={s.c}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...(props.replay === true
              ? {
                  className: dot ? 'ink dot' : 'ink',
                  ...(dot ? {} : { pathLength: 1 }),
                  style: {
                    animationDuration: `${each}ms`,
                    animationDelay: `${Math.round(i * each)}ms`,
                  },
                }
              : {})}
          />
        );
      })}
    </>
  );
}

/** A saved drawing. Without a label it is decoration (for example inside a labelled button). */
export function DrawingArt(props: {
  entry: string;
  label?: string;
  className?: string;
  /** Lines only, with no paper behind them (clothes on a pet, the easel). */
  bare?: boolean;
  /** The lines draw themselves once when the drawing appears. */
  replay?: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      {...(props.label === undefined
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': props.label })}
      {...(props.className === undefined ? {} : { className: props.className })}
    >
      <Lines
        drawing={parseEntry(props.entry) ?? []}
        {...(props.bare === true ? { bare: true } : {})}
        {...(props.replay === true ? { replay: true } : {})}
      />
    </svg>
  );
}
