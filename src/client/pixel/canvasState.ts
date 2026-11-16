export type CanvasState = { cells: number[]; history: number[][] };
export type CanvasAction =
  | { type: 'strokeStart' }
  | { type: 'paint'; index: number; color: number }
  | { type: 'undo' };

export const emptyCanvas = (): CanvasState => ({
  cells: Array<number>(64).fill(0),
  history: [],
});

export function remaining(cells: number[], budget: number[]): number[] {
  return budget.map((b, i) => b - cells.filter((c) => c === i + 1).length);
}

export const toEntry = (cells: number[]): string => cells.join('');
export const fromEntry = (entry: string): number[] => [...entry].map(Number);

export function canvasReducer(budget: number[]) {
  return (state: CanvasState, action: CanvasAction): CanvasState => {
    switch (action.type) {
      case 'strokeStart':
        return { cells: state.cells, history: [...state.history, state.cells] };
      case 'paint': {
        const current = state.cells[action.index];
        if (current === undefined || current === action.color) return state;
        if (
          action.color !== 0 &&
          (remaining(state.cells, budget)[action.color - 1] ?? 0) <= 0
        ) {
          return state;
        }
        const cells = state.cells.slice();
        cells[action.index] = action.color;
        return { ...state, cells };
      }
      case 'undo': {
        const history = state.history.slice();
        let prev = history.pop();
        // A stroke that changed nothing left the same array in history. Skip those.
        while (prev !== undefined && prev === state.cells) prev = history.pop();
        return prev === undefined
          ? { cells: state.cells, history }
          : { cells: prev, history };
      }
    }
  };
}
