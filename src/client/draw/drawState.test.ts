import { describe, it, expect } from 'vitest';
import {
  ERASE_RADIUS,
  MAX_USED_COLORS,
  drawReducer,
  emptyDraw,
  fromDraft,
  remaining,
  toEntry,
  usedColors,
} from './drawState';
import type { DrawAction, DrawState } from './drawState';
import {
  DOT_INK,
  MAX_POINTS,
  MAX_STROKES,
  MIN_INK,
  MIN_STEP,
  SIZE,
  inkUsed,
  parseEntry,
  validateEntry,
} from '../../shared/entry';
import type { Drawing } from '../../shared/entry';

const BUDGET = 1000;

function run(
  actions: DrawAction[],
  budget = BUDGET,
  from: DrawState = emptyDraw()
): DrawState {
  return actions.reduce(drawReducer(budget), from);
}

const start = (x: number, y: number): DrawAction => ({ type: 'start', x, y });
const move = (x: number, y: number): DrawAction => ({ type: 'move', x, y });
const end: DrawAction = { type: 'end' };
const undo: DrawAction = { type: 'undo' };
const eraser: DrawAction = { type: 'tool', tool: 'eraser' };

function withStrokes(strokes: Drawing, budget = BUDGET): DrawState {
  const state = fromDraft(JSON.stringify(strokes), budget);
  if (state === null) throw new Error('bad fixture');
  return state;
}

describe('pen', () => {
  it('a tap makes a dot that costs DOT_INK', () => {
    const s = run([start(50, 60), end]);
    expect(s.strokes).toEqual([{ c: '#333333', p: [50, 60, 50, 60] }]);
    expect(inkUsed(s.strokes)).toBe(DOT_INK);
    expect(remaining(s, BUDGET)).toBe(BUDGET - DOT_INK);
    expect(s.active).toBe(false);
  });

  it('start then moves draw a line whose cost matches inkUsed', () => {
    const s = run([start(10, 10), move(40, 10), move(40, 50), end]);
    expect(s.strokes[0]?.p).toEqual([10, 10, 40, 10, 40, 50]);
    expect(inkUsed(s.strokes)).toBe(70);
    expect(remaining(s, BUDGET)).toBe(BUDGET - 70);
  });

  it('ignores a move shorter than MIN_STEP', () => {
    const a = run([start(10, 10)]);
    expect(drawReducer(BUDGET)(a, move(10 + MIN_STEP - 1, 10))).toBe(a);
  });

  it('the first real move replaces the dot second point', () => {
    const s = run([start(10, 10), move(30, 10)]);
    expect(s.strokes[0]?.p).toEqual([10, 10, 30, 10]);
  });

  it('a line stops growing exactly when the next point would exceed the budget', () => {
    const budget = 30;
    const reduce = drawReducer(budget);
    const s = run([start(0, 0), move(10, 0), move(20, 0), move(30, 0)], budget);
    expect(inkUsed(s.strokes)).toBe(30);
    expect(remaining(s, budget)).toBe(0);
    // 4 units past the end: at least MIN_STEP, so only the budget refuses it
    expect(reduce(s, move(34, 0))).toBe(s);
    expect(reduce(s, move(60, 0))).toBe(s);
    expect(remaining(s, budget)).toBeGreaterThanOrEqual(0);
  });

  it('a first move shorter than DOT_INK keeps the cost at DOT_INK', () => {
    const s = run([start(10, 10), move(10 + MIN_STEP, 10)]);
    expect(s.strokes[0]?.p).toEqual([10, 10, 13, 10]);
    expect(inkUsed(s.strokes)).toBe(DOT_INK);
  });

  it('refuses start when a dot would exceed MAX_POINTS', () => {
    const budget = 1_000_000;
    const reduce = drawReducer(budget);
    const zigzag = (count: number): DrawState => {
      const p: number[] = [];
      for (let i = 0; i < count; i++) p.push(i % 2 === 0 ? 0 : 5, 0);
      return withStrokes([{ c: '#333333', p }], budget);
    };
    const full = zigzag(MAX_POINTS);
    expect(reduce(full, start(100, 100))).toBe(full);
    const almost = zigzag(MAX_POINTS - 1);
    expect(reduce(almost, start(100, 100))).toBe(almost);
    const fits = reduce(zigzag(MAX_POINTS - 2), start(100, 100));
    expect(fits.active).toBe(true);
    expect(parseEntry(toEntry(fits))).not.toBeNull();
  });

  it('a second start while active is ignored', () => {
    const a = run([start(10, 10)]);
    expect(drawReducer(BUDGET)(a, start(80, 80))).toBe(a);
  });

  it('ignores non-finite coordinates', () => {
    const reduce = drawReducer(BUDGET);
    const e = emptyDraw();
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(reduce(e, start(bad, 5))).toBe(e);
      expect(reduce(e, start(5, bad))).toBe(e);
    }
    const a = run([start(10, 10)]);
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(reduce(a, move(bad, 50))).toBe(a);
      expect(reduce(a, move(50, bad))).toBe(a);
    }
  });

  it('refuses start when remaining is below DOT_INK', () => {
    const budget = DOT_INK + 3;
    const a = run([start(5, 5), end], budget);
    expect(remaining(a, budget)).toBe(3);
    expect(drawReducer(budget)(a, start(100, 100))).toBe(a);
  });

  it('refuses start at MAX_STROKES lines', () => {
    const strokes: Drawing = Array.from({ length: MAX_STROKES }, () => ({
      c: '#333333',
      p: [1, 1, 1, 1],
    }));
    const a = withStrokes(strokes, 1_000_000);
    expect(drawReducer(1_000_000)(a, start(9, 9))).toBe(a);
  });

  it('stops a line at MAX_POINTS points in total', () => {
    const budget = 1_000_000;
    const reduce = drawReducer(budget);
    // MAX_POINTS - 2 points in one line, then a new dot makes MAX_POINTS
    const p: number[] = [];
    for (let i = 0; i < MAX_POINTS - 2; i++) p.push(i % 2 === 0 ? 0 : 5, 0);
    const a = withStrokes([{ c: '#333333', p }], budget);
    const dot = reduce(a, start(100, 100));
    const total = (s: DrawState) =>
      s.strokes.reduce((n, x) => n + x.p.length / 2, 0);
    expect(total(dot)).toBe(MAX_POINTS);
    // the dot's second point is replaced, so it still fits
    const grown = reduce(dot, move(130, 100));
    expect(total(grown)).toBe(MAX_POINTS);
    // one more point would exceed MAX_POINTS
    expect(reduce(grown, move(160, 100))).toBe(grown);
  });

  it('ignores move while not active', () => {
    const a = emptyDraw();
    expect(drawReducer(BUDGET)(a, move(50, 50))).toBe(a);
  });

  it('rounds and clamps coordinates', () => {
    const s = run([start(-20, 999), move(10.4, 300.6)]);
    expect(s.strokes[0]?.p).toEqual([0, SIZE - 1, 10, SIZE - 1]);
    const t = run([start(12.5, 7.4)]);
    expect(t.strokes[0]?.p).toEqual([13, 7, 13, 7]);
  });
});

describe('eraser', () => {
  const lines: Drawing = [
    { c: '#ff0000', p: [0, 100, 200, 100] },
    { c: '#00ff00', p: [10, 200, 10, 200] },
  ];

  it('removes a line touched mid segment and leaves a far line', () => {
    const base = withStrokes(lines);
    const s = run(
      [eraser, start(100, 100 + ERASE_RADIUS - 1), end],
      BUDGET,
      base
    );
    expect(s.strokes.map((x) => x.c)).toEqual(['#00ff00']);
  });

  it('leaves a line farther than ERASE_RADIUS', () => {
    const base = withStrokes(lines);
    const s = run(
      [eraser, start(100, 100 + ERASE_RADIUS + 5), end],
      BUDGET,
      base
    );
    expect(s.strokes).toHaveLength(2);
  });

  it('erases a dot', () => {
    const base = withStrokes(lines);
    const s = run([eraser, start(12, 202), end], BUDGET, base);
    expect(s.strokes.map((x) => x.c)).toEqual(['#ff0000']);
  });

  it('gives the cost back', () => {
    const base = withStrokes(lines);
    expect(remaining(base, BUDGET)).toBe(BUDGET - 200 - DOT_INK);
    const s = run([eraser, start(100, 100), end], BUDGET, base);
    expect(remaining(s, BUDGET)).toBe(BUDGET - DOT_INK);
  });

  it('erases on move within the same history step', () => {
    const base = withStrokes(lines);
    const s = run(
      [eraser, start(150, 150), move(100, 100), move(10, 200), end],
      BUDGET,
      base
    );
    expect(s.strokes).toHaveLength(0);
    expect(s.history).toHaveLength(1);
    expect(run([undo], BUDGET, s).strokes).toEqual(base.strokes);
  });

  it('a step that touches nothing leaves history unchanged after end', () => {
    const base = withStrokes(lines);
    const s = run([eraser, start(250, 250), move(240, 240), end], BUDGET, base);
    expect(s.history).toHaveLength(0);
    expect(s.strokes).toBe(base.strokes);
  });
});

describe('undo', () => {
  it('restores the drawing after a pen step', () => {
    const s = run([start(10, 10), move(50, 10), end, start(0, 0), end]);
    const u = run([undo], BUDGET, s);
    expect(u.strokes).toHaveLength(1);
    expect(u.history).toHaveLength(1);
    expect(u.active).toBe(false);
    expect(run([undo], BUDGET, u).strokes).toEqual([]);
  });

  it('restores the drawing after an eraser step', () => {
    const drawn = run([start(10, 10), move(80, 10), end]);
    const erased = run([eraser, start(40, 10), end], BUDGET, drawn);
    expect(erased.strokes).toHaveLength(0);
    expect(run([undo], BUDGET, erased).strokes).toEqual(drawn.strokes);
  });

  it('on empty history returns the same object', () => {
    const a = emptyDraw();
    expect(drawReducer(BUDGET)(a, undo)).toBe(a);
  });
});

describe('color and tool', () => {
  it('rejects bad colors and keeps state', () => {
    const a = emptyDraw();
    const reduce = drawReducer(BUDGET);
    expect(reduce(a, { type: 'color', color: 'red' })).toBe(a);
    expect(reduce(a, { type: 'color', color: '#ABCDEF' })).toBe(a);
  });

  it('accepts a good color and switches to the pen', () => {
    const a = run([eraser]);
    expect(a.tool).toBe('eraser');
    const b = run([{ type: 'color', color: '#abcdef' }], BUDGET, a);
    expect(b.color).toBe('#abcdef');
    expect(b.tool).toBe('pen');
  });

  it('color and tool changes are ignored in the middle of a drag', () => {
    const reduce = drawReducer(BUDGET);
    const erasing = run(
      [eraser, start(5, 5)],
      BUDGET,
      withStrokes([{ c: '#ff0000', p: [100, 100, 150, 100] }])
    );
    const colored = reduce(erasing, { type: 'color', color: '#123456' });
    const after = reduce(colored, move(250, 250));
    expect(after.tool).toBe('eraser');
    expect(after.strokes).toEqual(erasing.strokes);
    const drawing = run([start(10, 10)]);
    expect(reduce(drawing, eraser)).toBe(drawing);
  });

  it('draws new lines in the chosen color', () => {
    const s = run([{ type: 'color', color: '#123456' }, start(5, 5), end]);
    expect(s.strokes[0]?.c).toBe('#123456');
  });
});

describe('purity', () => {
  it('never mutates the previous state or its arrays', () => {
    const actions: DrawAction[] = [
      start(10, 10),
      move(40, 10),
      move(70, 10),
      end,
      { type: 'color', color: '#112233' },
      start(0, 0),
      move(20, 20),
      end,
      eraser,
      start(40, 10),
      move(15, 15),
      end,
      undo,
    ];
    const reduce = drawReducer(BUDGET);
    let state = emptyDraw();
    for (const action of actions) {
      const frozen = JSON.stringify(state);
      const next = reduce(state, action);
      expect(JSON.stringify(state)).toBe(frozen);
      state = next;
    }
  });
});

describe('toEntry, fromDraft, usedColors', () => {
  it('toEntry passes validateEntry once the drawing costs MIN_INK', () => {
    const s = run([start(10, 10), move(10 + MIN_INK, 10), end]);
    expect(inkUsed(s.strokes)).toBeGreaterThanOrEqual(MIN_INK);
    expect(validateEntry(toEntry(s), BUDGET)).toEqual({ ok: true });
  });

  it('fromDraft returns null for a malformed string', () => {
    expect(fromDraft('nope', BUDGET)).toBeNull();
    expect(fromDraft('[{"c":"red","p":[1,2,3,4]}]', BUDGET)).toBeNull();
  });

  it('fromDraft returns null over budget', () => {
    expect(fromDraft('[{"c":"#333333","p":[0,0,200,0]}]', 100)).toBeNull();
  });

  it('fromDraft restores a drawing exactly at the budget', () => {
    const s = fromDraft('[{"c":"#333333","p":[0,0,100,0]}]', 100);
    expect(s).not.toBeNull();
    expect(remaining(s ?? emptyDraw(), 100)).toBe(0);
  });

  it('fromDraft restores a small valid draft', () => {
    const s = fromDraft('[{"c":"#ff0000","p":[1,1,1,1]}]', BUDGET, '#00ff00');
    expect(s).not.toBeNull();
    expect(s?.strokes).toEqual([{ c: '#ff0000', p: [1, 1, 1, 1] }]);
    expect(s?.color).toBe('#00ff00');
    expect(s?.history).toEqual([]);
    expect(s?.tool).toBe('pen');
    expect(s?.active).toBe(false);
  });

  it('usedColors orders by most recent without duplicates', () => {
    const s = withStrokes([
      { c: '#111111', p: [1, 1, 1, 1] },
      { c: '#222222', p: [1, 1, 1, 1] },
      { c: '#111111', p: [1, 1, 1, 1] },
      { c: '#333333', p: [1, 1, 1, 1] },
    ]);
    expect(usedColors(s)).toEqual(['#333333', '#111111', '#222222']);
  });

  it('usedColors stops at MAX_USED_COLORS', () => {
    const strokes: Drawing = Array.from(
      { length: MAX_USED_COLORS + 3 },
      (_, i) => ({ c: `#00000${i}`, p: [1, 1, 1, 1] })
    );
    const colors = usedColors(withStrokes(strokes));
    expect(colors).toHaveLength(MAX_USED_COLORS);
    expect(colors[0]).toBe(`#00000${MAX_USED_COLORS + 2}`);
  });
});
