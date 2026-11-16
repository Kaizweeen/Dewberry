import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiFailure, api } from './api';

const GENERIC = 'Something went wrong. Try again.';

function reply(status: number, body: unknown) {
  const fetchMock = vi.fn(
    async (_path: string, _init?: RequestInit) =>
      new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status,
      })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function failure(run: () => Promise<unknown>): Promise<ApiFailure> {
  try {
    await run();
  } catch (err) {
    if (err instanceof ApiFailure) return err;
    throw err;
  }
  throw new Error('expected an ApiFailure');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET routes', () => {
  it('day, gallery, and results call their paths and return the body', async () => {
    const f = reply(200, { ok: 1 });
    await api.day();
    await api.gallery();
    await api.results();
    expect(f.mock.calls.map((c) => c[0])).toEqual([
      '/api/day',
      '/api/gallery',
      '/api/results',
    ]);
    expect(await api.day()).toEqual({ ok: 1 });
  });

  it('throws ApiFailure with the status and the body error', async () => {
    reply(401, { error: 'Log in to Reddit to play.' });
    const err = await failure(() => api.day());
    expect(err.status).toBe(401);
    expect(err.message).toBe('Log in to Reddit to play.');
  });

  it('uses the generic message when the body has no error string', async () => {
    reply(500, 'not json');
    expect((await failure(() => api.gallery())).message).toBe(GENERIC);
    reply(404, { nope: true });
    const err = await failure(() => api.results());
    expect(err.status).toBe(404);
    expect(err.message).toBe(GENERIC);
  });
});

describe('submit', () => {
  it('posts the entry as JSON', async () => {
    const f = reply(200, { ok: true, entry: '[]', streak: 2 });
    expect(await api.submit('[]')).toEqual({
      ok: true,
      entry: '[]',
      streak: 2,
    });
    const [path, init] = f.mock.calls[0] ?? [];
    expect(path).toBe('/api/entry');
    expect(init).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ entry: '[]' }),
    });
  });

  it('returns the body for 400 and 409', async () => {
    const invalid = { ok: false, error: 'invalid', reason: 'Too short.' };
    reply(400, invalid);
    expect(await api.submit('x')).toEqual(invalid);
    const closed = { ok: false, error: 'closed', reason: 'Closed.' };
    reply(409, closed);
    expect(await api.submit('x')).toEqual(closed);
  });

  it('throws for any other status', async () => {
    reply(401, { error: 'Log in to Reddit to play.' });
    const err = await failure(() => api.submit('x'));
    expect(err.status).toBe(401);
    reply(500, {});
    expect((await failure(() => api.submit('x'))).message).toBe(GENERIC);
  });
});

describe('heart', () => {
  it('posts the target id as JSON', async () => {
    const f = reply(200, { ok: true, heartsLeft: 4 });
    expect(await api.heart('u1')).toEqual({ ok: true, heartsLeft: 4 });
    const [path, init] = f.mock.calls[0] ?? [];
    expect(path).toBe('/api/heart');
    expect(init).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ targetId: 'u1' }),
    });
  });

  it('returns the body for 409 and throws for other statuses', async () => {
    reply(409, { ok: false, error: 'already' });
    expect(await api.heart('u1')).toEqual({ ok: false, error: 'already' });
    reply(400, { error: 'Bad.' });
    const err = await failure(() => api.heart('u1'));
    expect(err.status).toBe(400);
    expect(err.message).toBe('Bad.');
  });
});

describe('network failure', () => {
  it('becomes ApiFailure with status 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      })
    );
    for (const run of [
      () => api.day(),
      () => api.submit('x'),
      () => api.heart('u1'),
    ]) {
      const err = await failure(run);
      expect(err.status).toBe(0);
      expect(err.message).toBe('Could not reach the game. Try again.');
    }
  });
});
