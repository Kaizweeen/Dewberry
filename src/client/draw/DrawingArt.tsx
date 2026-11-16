import { SIZE, STROKE_WIDTH, parseEntry } from '../../shared/entry';

export const PAPER = '#fbf7ec';

export function DrawingArt(props: {
  entry: string;
  label: string;
  className?: string;
}) {
  const drawing = parseEntry(props.entry) ?? [];
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={props.label}
      {...(props.className === undefined ? {} : { className: props.className })}
    >
      <rect width={SIZE} height={SIZE} fill={PAPER} />
      {drawing.map((s, i) => {
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
    </svg>
  );
}
