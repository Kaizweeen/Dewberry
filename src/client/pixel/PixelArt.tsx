export function PixelArt(props: {
  entry: string;
  colors: string[];
  size: number;
  label: string;
}) {
  return (
    <svg
      role="img"
      aria-label={props.label}
      width={props.size}
      height={props.size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
    >
      {[...props.entry].map((ch, i) =>
        ch === '0' ? null : (
          <rect
            key={i}
            x={i % 8}
            y={Math.floor(i / 8)}
            width={1}
            height={1}
            fill={props.colors[Number(ch) - 1]}
          />
        )
      )}
    </svg>
  );
}
