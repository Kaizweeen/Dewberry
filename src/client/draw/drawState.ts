import {
  DOT_INK,
  MAX_POINTS,
  MAX_STROKES,
  MIN_STEP,
  SIZE,
  inkUsed,
  parseEntry,
  toEntryString,
} from '../../shared/entry';
import type { Drawing } from '../../shared/entry';

export const ERASE_RADIUS = 10; // paper units: how close the eraser must come to a line to remove it
export const MAX_USED_COLORS = 6;

export type Tool = 'pen' | 'eraser';
export type DrawState = {
  strokes: Drawing; // the drawing so far
  history: Drawing[]; // snapshots for undo, oldest first
  color: string; // current pen color, '#rrggbb' lowercase
  tool: Tool;
  active: boolean; // true between pointer down and pointer up
};
export type DrawAction =
  | { type: 'start'; x: number; y: number }
  | { type: 'move'; x: number; y: number }
  | { type: 'end' }
  | { type: 'undo' }
  | { type: 'color'; color: string }
  | { type: 'tool'; tool: Tool };

export function emptyDraw(color = '#333333'): DrawState {
  return { strokes: [], history: [], color, tool: 'pen', active: false };
}

export function remaining(state: DrawState, budget: number): number {
  return budget - inkUsed(state.strokes);
}

export function toEntry(state: DrawState): string {
  return toEntryString(state.strokes);
}

/** Restores a saved draft. Returns null unless the string parses with parseEntry and costs no more than budget. A draft may be below MIN_INK. */
export function fromDraft(
  entry: string,
  budget: number,
  color?: string
): DrawState | null {
  const strokes = parseEntry(entry);
  if (strokes === null || inkUsed(strokes) > budget) return null;
  return { ...emptyDraw(color), strokes };
}

/** Distinct colors in the drawing, most recently drawn first, at most MAX_USED_COLORS. */
export function usedColors(state: DrawState): string[] {
  const out: string[] = [];
  for (let i = state.strokes.length - 1; i >= 0; i--) {
    const c = state.strokes[i]?.c;
    if (c !== undefined && !out.includes(c)) out.push(c);
    if (out.length === MAX_USED_COLORS) break;
  }
  return out;
}

const clampCoord = (n: number): number =>
  Math.min(SIZE - 1, Math.max(0, Math.round(n)));

/** Smallest distance from (x, y) to any segment of the line. A dot is a zero-length segment. */
function distanceToLine(p: number[], x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i + 3 < p.length; i += 2) {
    const ax = p[i] ?? 0;
    const ay = p[i + 1] ?? 0;
    const dx = (p[i + 2] ?? 0) - ax;
    const dy = (p[i + 3] ?? 0) - ay;
    const len2 = dx * dx + dy * dy;
    const t =
      len2 === 0
        ? 0
        : Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / len2));
    const ex = x - (ax + t * dx);
    const ey = y - (ay + t * dy);
    best = Math.min(best, Math.sqrt(ex * ex + ey * ey));
  }
  return best;
}

/** Removes lines near the point. Returns the same array when nothing is removed. */
function erase(strokes: Drawing, x: number, y: number): Drawing {
  const kept = strokes.filter((s) => distanceToLine(s.p, x, y) > ERASE_RADIUS);
  return kept.length === strokes.length ? strokes : kept;
}

function pointCount(strokes: Drawing): number {
  let n = 0;
  for (const s of strokes) n += s.p.length / 2;
  return n;
}

export function drawReducer(
  budget: number
): (state: DrawState, action: DrawAction) => DrawState {
  return (state, action) => {
    switch (action.type) {
      case 'start': {
        const x = clampCoord(action.x);
        const y = clampCoord(action.y);
        if (state.tool === 'eraser') {
          return {
            ...state,
            history: [...state.history, state.strokes],
            strokes: erase(state.strokes, x, y),
            active: true,
          };
        }
        if (
          remaining(state, budget) < DOT_INK ||
          state.strokes.length >= MAX_STROKES
        ) {
          return state;
        }
        return {
          ...state,
          history: [...state.history, state.strokes],
          strokes: [...state.strokes, { c: state.color, p: [x, y, x, y] }],
          active: true,
        };
      }
      case 'move': {
        if (!state.active) return state;
        const x = clampCoord(action.x);
        const y = clampCoord(action.y);
        if (state.tool === 'eraser') {
          const strokes = erase(state.strokes, x, y);
          return strokes === state.strokes ? state : { ...state, strokes };
        }
        const last = state.strokes[state.strokes.length - 1];
        if (last === undefined) return state;
        const n = last.p.length;
        const lx = last.p[n - 2] ?? 0;
        const ly = last.p[n - 1] ?? 0;
        const dx = x - lx;
        const dy = y - ly;
        if (Math.sqrt(dx * dx + dy * dy) < MIN_STEP) return state;
        const isDot = n === 4 && last.p[0] === lx && last.p[1] === ly;
        const p = isDot ? [lx, ly, x, y] : [...last.p, x, y];
        const strokes = [...state.strokes.slice(0, -1), { c: last.c, p }];
        if (inkUsed(strokes) > budget || pointCount(strokes) > MAX_POINTS) {
          return state;
        }
        return { ...state, strokes };
      }
      case 'end': {
        if (!state.active) return state;
        const prev = state.history[state.history.length - 1];
        // An eraser step that removed nothing leaves its snapshot equal to the drawing.
        const unchanged = prev === state.strokes;
        return {
          ...state,
          active: false,
          history: unchanged ? state.history.slice(0, -1) : state.history,
        };
      }
      case 'undo': {
        const prev = state.history[state.history.length - 1];
        if (prev === undefined) return state;
        return {
          ...state,
          strokes: prev,
          history: state.history.slice(0, -1),
          active: false,
        };
      }
      case 'color':
        if (!/^#[0-9a-f]{6}$/.test(action.color)) return state;
        return { ...state, color: action.color, tool: 'pen' };
      case 'tool':
        return { ...state, tool: action.tool };
    }
  };
}
