import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { vars } from '../ui';
import { hexToHsv, hsvToHex } from './color';

type Hsv = { h: number; s: number; v: number };

const clamp = (n: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, n));

/** Reads a color back into hue, saturation, and brightness. Grays keep the hue (and black the saturation) that was already chosen. */
function fromHex(hex: string, keep: Hsv): Hsv {
  const found = hexToHsv(hex);
  if (found === null) return keep;
  return {
    h: found.s === 0 || found.v === 0 ? keep.h : found.h,
    s: found.v === 0 ? keep.s : found.s,
    v: found.v,
  };
}

/** Where the pointer is inside the element, as 0 to 1 on each axis. */
function fractions(e: PointerEvent<HTMLElement>): { x: number; y: number } {
  const r = e.currentTarget.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return { x: 0, y: 0 };
  return {
    x: clamp((e.clientX - r.left) / r.width, 0, 1),
    y: clamp((e.clientY - r.top) / r.height, 0, 1),
  };
}

/** Pointer handlers that report a position while the pointer is held down on the element. */
function useDrag(onPoint: (x: number, y: number) => void) {
  const down = useRef(false);
  const stop = () => {
    down.current = false;
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      down.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Capture is a convenience; dragging still works without it.
      }
      const f = fractions(e);
      onPoint(f.x, f.y);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (!down.current) return;
      const f = fractions(e);
      onPoint(f.x, f.y);
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onLostPointerCapture: stop,
  };
}

/** A square for light and strength, and a strip for hue. */
export function Picker(props: {
  color: string;
  onChange: (hex: string) => void;
}) {
  const [hsv, setHsv] = useState<Hsv>(() =>
    fromHex(props.color, { h: 0, s: 0, v: 0 })
  );
  // The color this picker last knew. When the parent changes it (a used-color chip), follow it.
  const [known, setKnown] = useState(props.color);
  let { h, s, v } = hsv;
  if (props.color !== known) {
    const next = fromHex(props.color, hsv);
    ({ h, s, v } = next);
    setHsv(next);
    setKnown(props.color);
  }
  const hex = hsvToHex(h, s, v);

  const commit = (next: Hsv) => {
    const out = hsvToHex(next.h, next.s, next.v);
    setHsv(next);
    setKnown(out);
    props.onChange(out);
  };

  const squareDrag = useDrag((x, y) => commit({ h, s: x, v: 1 - y }));
  const stripDrag = useDrag((x) => commit({ h: x * 360, s, v }));

  const onSquareKey = (e: KeyboardEvent<HTMLElement>) => {
    const step = 0.05;
    if (e.key === 'ArrowLeft') commit({ h, s: clamp(s - step, 0, 1), v });
    else if (e.key === 'ArrowRight') commit({ h, s: clamp(s + step, 0, 1), v });
    else if (e.key === 'ArrowUp') commit({ h, s, v: clamp(v + step, 0, 1) });
    else if (e.key === 'ArrowDown') commit({ h, s, v: clamp(v - step, 0, 1) });
    else return;
    e.preventDefault();
  };
  const onStripKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowLeft') commit({ h: clamp(h - 5, 0, 360), s, v });
    else if (e.key === 'ArrowRight') commit({ h: clamp(h + 5, 0, 360), s, v });
    else return;
    e.preventDefault();
  };

  return (
    <>
      <div
        className="sv"
        style={vars({ '--h': h })}
        role="slider"
        aria-label="Light and strength"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        aria-valuetext={hex}
        tabIndex={0}
        onKeyDown={onSquareKey}
        {...squareDrag}
      >
        <i
          className="knob"
          style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
        ></i>
      </div>
      <div
        className="hue flat"
        role="slider"
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(h)}
        aria-valuetext={hex}
        tabIndex={0}
        onKeyDown={onStripKey}
        {...stripDrag}
      >
        <i className="knob" style={{ left: `${(h / 360) * 100}%` }}></i>
      </div>
    </>
  );
}
