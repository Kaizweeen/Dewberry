import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import {
  MIN_INK,
  MIN_STEP,
  SIZE,
  inkUsed,
  toEntryString,
} from '../../shared/entry';
import type { Drawing } from '../../shared/entry';
import type { DayView } from '../../shared/types';
import { ApiFailure, api } from '../api';
import { Lines } from '../draw/DrawingArt';
import { Picker } from '../draw/Picker';
import {
  drawReducer,
  emptyDraw,
  fromDraft,
  remaining,
  toEntry,
  usedColors,
} from '../draw/drawState';
import type { DrawAction, DrawState } from '../draw/drawState';
import { Icon, useWide, vars } from '../ui';

// Where everything stands, on the phone and on the wide stage. On the wide stage
// the sheet is bigger (416 against 288) and the controls stand in a column to
// its right, the line meter and colors under the prompt and the buttons at the
// sheet's bottom edge.
const PHONE = {
  sheet: 288,
  board: { left: 35, top: 62 },
  home: { left: 12, top: 12 },
  prompt: { left: 64, top: 12, width: 299 },
  meter: { left: 12, top: 372, width: 351 },
  picker: { left: 12, top: 414, width: 351, height: 104 },
  buttons: { left: 12, top: 524, width: 351 },
} as const;
const DESKTOP = {
  sheet: 416,
  board: { left: 12, top: 34 },
  home: { left: 460, top: 34 },
  prompt: { left: 512, top: 34, width: 276 },
  meter: { left: 460, top: 90, width: 328 },
  picker: { left: 460, top: 134, width: 328, height: 264 },
  buttons: { left: 460, top: 406, width: 328 },
} as const;

const NOTICE_MS = 4000;
const CONFIRM_MS = 4000;
const PULSE_GAP_MS = 500;
const NO_LINE = 'No line left. Erase to get some back.';
const FAILED = 'That did not work. Try again.';

export function Draw(props: {
  view: DayView;
  onSubmitted: (result: { entry: string; streak: number }) => void;
  onClosed: () => void;
  onHome: () => void;
}) {
  const { view } = props;
  const draftKey = `dewberry:draft:${view.day}`;
  const reducer = useMemo(() => drawReducer(view.budget), [view.budget]);

  const [state, dispatch] = useReducer(reducer, null, (): DrawState => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved !== null) {
        const restored = fromDraft(saved, view.budget);
        if (restored !== null) return restored;
      }
    } catch {
      // Storage may be unavailable. Start with an empty paper.
    }
    return emptyDraw();
  });

  const { strokes } = state;
  // Saved when a stroke ends, on undo and on erase, not on every pointer move.
  const { active } = state;
  useEffect(() => {
    if (active) return;
    try {
      localStorage.setItem(draftKey, toEntryString(strokes));
    } catch {
      // A draft that cannot be saved is lost on reload, nothing more.
    }
  }, [draftKey, strokes, active]);

  const left = remaining(state, view.budget);
  const percent = Math.max(0, Math.round((left / view.budget) * 100));
  const fill = Math.min(100, Math.max(0, (left / view.budget) * 100));

  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (notice === null) return;
    const t = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);

  // Pulse the meter, and say so in words, when a line is refused for lack of line.
  const [pulse, setPulse] = useState(0);
  const lastPulse = useRef(0);
  const refuse = () => {
    setNotice(NO_LINE);
    const now = Date.now();
    if (now - lastPulse.current < PULSE_GAP_MS) return;
    lastPulse.current = now;
    setPulse((n) => n + 1);
  };

  const paperPoint = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * SIZE,
      y: ((e.clientY - r.top) / r.height) * SIZE,
    };
  };
  // Only the first finger, or the main mouse button, draws.
  const pointer = useRef<number | null>(null);
  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!e.isPrimary || e.button !== 0) return;
    const action: DrawAction = { type: 'start', ...paperPoint(e) };
    if (reducer(state, action) === state) {
      if (state.tool === 'pen' && !state.active) refuse();
      return;
    }
    pointer.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a convenience; drawing still works without it.
    }
    dispatch(action);
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (pointer.current !== e.pointerId || !state.active) return;
    const action: DrawAction = { type: 'move', ...paperPoint(e) };
    const last = state.strokes[state.strokes.length - 1];
    const n = last?.p.length ?? 0;
    const dist = Math.hypot(
      action.x - (last?.p[n - 2] ?? 0),
      action.y - (last?.p[n - 1] ?? 0)
    );
    if (
      state.tool === 'pen' &&
      dist >= MIN_STEP &&
      left < dist &&
      reducer(state, action) === state
    ) {
      refuse();
    }
    dispatch(action);
  };
  const onEnd = (e: PointerEvent<SVGSVGElement>) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    dispatch({ type: 'end' });
  };

  // The first Submit tap arms the button for a few seconds. Drawing more disarms it.
  const [armedFor, setArmedFor] = useState<Drawing | null>(null);
  const armed = armedFor === strokes;
  useEffect(() => {
    if (armedFor === null) return;
    const t = setTimeout(() => setArmedFor(null), CONFIRM_MS);
    return () => clearTimeout(t);
  }, [armedFor]);

  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  const submit = async () => {
    if (sendingRef.current) return;
    if (!armed) {
      setArmedFor(strokes);
      return;
    }
    setArmedFor(null);
    sendingRef.current = true;
    setSending(true);
    try {
      const result = await api.submit(toEntry(state));
      if (result.ok) {
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // Nothing to clear if storage is unavailable.
        }
        props.onSubmitted({ entry: result.entry, streak: result.streak });
      } else if (result.error === 'closed') {
        props.onClosed();
      } else {
        setNotice(
          typeof result.reason === 'string' && result.reason !== ''
            ? result.reason
            : FAILED
        );
      }
    } catch (err) {
      setNotice(
        err instanceof ApiFailure
          ? err.message
          : 'Something went wrong. Try again.'
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const L = useWide() ? DESKTOP : PHONE;
  const colors = usedColors(state);
  const chip = colors.length > 4 ? 26 : 40;
  const tooLittle = inkUsed(strokes) < MIN_INK;
  const label = sending ? 'Sending' : armed ? 'Sure? It is final' : 'Submit';

  return (
    <>
      <button
        className="artbtn"
        style={{ ...L.home, width: 44, height: 44 }}
        aria-label="Home"
        disabled={sending}
        onClick={props.onHome}
      >
        <img src="/art/home-btn.png" alt="" />
      </button>
      <div
        className="px"
        style={{ ...L.prompt, height: 44 }}
        aria-live="polite"
      >
        {notice === null ? (
          <h1 className="t24 display" style={{ padding: '3px 12px 0' }}>
            {view.prompt}
          </h1>
        ) : (
          <p className="t12" style={{ padding: '3px 8px 0' }}>
            {notice}
          </p>
        )}
      </div>
      <div className="px board" style={L.board}>
        <svg
          className="sheet"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ width: L.sheet, height: L.sheet }}
          role="img"
          aria-label="Your drawing so far"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onEnd}
          onPointerCancel={onEnd}
          onLostPointerCapture={onEnd}
        >
          <Lines drawing={strokes} />
        </svg>
      </div>
      <div className="px" style={{ ...L.meter, height: 36 }}>
        <div
          className="t16"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 10,
            alignItems: 'center',
            height: '100%',
            padding: '0 12px',
          }}
        >
          <span>Line left</span>
          <span
            key={pulse}
            className={pulse === 0 ? 'meter big' : 'meter big pulse'}
            style={vars({ '--left': `${fill}%` })}
            role="img"
            aria-label={`Line left: ${percent} percent`}
          >
            <b></b>
          </span>
          <span>{percent}%</span>
        </div>
      </div>
      <div className="px" style={L.picker}>
        <div
          style={vars({
            display: 'grid',
            gridTemplateColumns: '1fr 88px',
            gap: 8,
            height: '100%',
            padding: 8,
            '--k': '3px',
          })}
        >
          <div
            style={{ display: 'grid', gridTemplateRows: '1fr 20px', gap: 8 }}
          >
            <Picker
              color={state.color}
              onChange={(color) => dispatch({ type: 'color', color })}
            />
          </div>
          <div className="used" style={{ alignContent: 'start' }}>
            {colors.map((c) => (
              <button
                key={c}
                className="px in chip"
                style={vars({ '--fill': c, width: chip, height: chip })}
                aria-label={c}
                aria-pressed={c === state.color}
                onClick={() => dispatch({ type: 'color', color: c })}
              ></button>
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          ...L.buttons,
          display: 'grid',
          gridTemplateColumns: '60px 60px 1fr',
          gap: 8,
        }}
      >
        <button
          className="px in btn"
          style={{ height: 60 }}
          aria-label="Undo"
          disabled={state.history.length === 0}
          onClick={() => dispatch({ type: 'undo' })}
        >
          <Icon name="undo" width={28} height={28} />
        </button>
        <button
          className="px in btn"
          style={{ height: 60 }}
          aria-label="Eraser"
          aria-pressed={state.tool === 'eraser'}
          onClick={() =>
            dispatch({
              type: 'tool',
              tool: state.tool === 'eraser' ? 'pen' : 'eraser',
            })
          }
        >
          <Icon name="erase" width={28} height={28} />
        </button>
        <button
          className={`px in btn primary ${armed ? 't16' : 't32'}`}
          style={{ height: 60 }}
          disabled={tooLittle || sending}
          onClick={() => void submit()}
        >
          {label}
        </button>
      </div>
    </>
  );
}
