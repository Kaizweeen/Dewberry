import type {
  DayView,
  GalleryPage,
  HeartResult,
  PetAction,
  PetResult,
  PetView,
  Results,
  SubmitResult,
} from '../shared/types';

const GENERIC = 'Something went wrong. Try again.';
const NETWORK = 'Could not reach the game. Try again.';

export class ApiFailure extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiFailure';
    this.status = status;
  }
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init);
  } catch {
    throw new ApiFailure(0, NETWORK);
  }
}

async function failureOf(res: Response): Promise<ApiFailure> {
  const body: unknown = await res.json().catch(() => null);
  const message =
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'string'
      ? body.error
      : GENERIC;
  return new ApiFailure(res.status, message);
}

/** Reads a JSON body. A body that cannot be read is a failure, not a result. */
async function bodyOf(res: Response) {
  try {
    return await res.json();
  } catch {
    throw new ApiFailure(res.status, GENERIC);
  }
}

async function get(path: string) {
  const res = await call(path);
  if (res.status !== 200) throw await failureOf(res);
  return bodyOf(res);
}

/** POSTs JSON. Statuses in `answers` are normal answers and return their body. */
async function post(path: string, payload: unknown, answers: number[]) {
  const res = await call(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!answers.includes(res.status)) throw await failureOf(res);
  return bodyOf(res);
}

export const api = {
  day: (): Promise<DayView> => get('/api/day'),
  submit: (entry: string): Promise<SubmitResult> =>
    post('/api/entry', { entry }, [200, 400, 409]),
  gallery: (): Promise<GalleryPage> => get('/api/gallery'),
  heart: (targetId: string): Promise<HeartResult> =>
    post('/api/heart', { targetId }, [200, 409]),
  results: (): Promise<Results> => get('/api/results'),
  pet: (): Promise<PetView> => get('/api/pet'),
  updatePet: (action: PetAction): Promise<PetResult> =>
    post('/api/pet/update', { action }, [200, 400]),
};
