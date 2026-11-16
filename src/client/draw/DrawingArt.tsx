import { SIZE, STROKE_WIDTH, parseEntry } from '../../shared/entry';
import type { Drawing } from '../../shared/entry';

export const PAPER = '#fbf7ec';

/** The paper and its lines, as the children of an svg with viewBox 0 0 SIZE SIZE. */
export function Lines(props: { drawing: Drawing; bare?: boolean }) {
  return (
    <>
      {props.bare !== true && <rect width={SIZE} height={SIZE} fill={PAPER} />}
      {props.drawing.map((s, i) => {
        const pts: string[] = [];
        for (let j = 0; j + 1 < s.p.length; j += 2) {
          pts.push(`${s.p[j]},${s.p[j + 1]}`);
        }
        return (
          <polyline
            key={i}
            points={pts.join(' ')}
            fill="none"
            stroke={s.c}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
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
  /** Lines only, with no paper behind them (clothes on a pet). */
  bare?: boolean;
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
      />
    </svg>
  );
}
