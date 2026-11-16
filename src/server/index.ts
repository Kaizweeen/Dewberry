import { Hono } from 'hono';
import type { Context } from 'hono';
import { serve } from '@hono/node-server';
import {
  context,
  createServer,
  getServerPort,
  reddit,
} from '@devvit/web/server';
import type { UiResponse } from '@devvit/web/shared';
import { contentForDay } from '../shared/content';
import {
  currentDay,
  getDayView,
  getGalleryPage,
  getResults,
  heartEntry,
  rollover,
  submitEntry,
} from './game';
import { redisStore as store } from './redisStore';
import { keys } from './store';

type Viewer = { userId: string; postId: string; day: number };

/**
 * Wraps a player route. The viewer and the post come from the Devvit request
 * context, never from the request body. The day is the one this post belongs to.
 */
const play =
  (handler: (me: Viewer, c: Context) => Promise<Response>) =>
  async (c: Context) => {
    const { userId, postId } = context;
    if (!userId || !postId) {
      return c.json({ error: 'Log in to Reddit to play.' }, 401);
    }
    const day = Number((await store.get(keys.postDay(postId))) ?? 0);
    if (day < 1) return c.json({ error: 'This post is not a game day.' }, 404);
    return handler({ userId, postId, day }, c);
  };

const api = new Hono();

api.get(
  '/day',
  play(async (me, c) => c.json(await getDayView(store, me)))
);

api.post(
  '/entry',
  play(async (me, c) => {
    const body = await c.req
      .json<{ entry?: unknown } | null>()
      .catch(() => null);
    // Entries are shown with their maker's name, so never invent one.
    const username = context.username ?? (await reddit.getCurrentUsername());
    if (!username) return c.json({ error: 'Log in to Reddit to play.' }, 401);
    const result = await submitEntry(store, {
      day: me.day,
      userId: me.userId,
      username,
      entry: body?.entry,
      now: Date.now(),
    });
    return c.json(
      result,
      result.ok ? 200 : result.error === 'closed' ? 409 : 400
    );
  })
);

api.get(
  '/gallery',
  play(async (me, c) => {
    const page = await getGalleryPage(store, me);
    if (!page) return c.json({ error: 'Submit your drawing first.' }, 409);
    return c.json(page);
  })
);

api.post(
  '/heart',
  play(async (me, c) => {
    const body = await c.req
      .json<{ targetId?: unknown } | null>()
      .catch(() => null);
    const result = await heartEntry(store, {
      day: me.day,
      userId: me.userId,
      targetId: typeof body?.targetId === 'string' ? body.targetId : '',
    });
    return c.json(result, result.ok ? 200 : 409);
  })
);

api.get(
  '/results',
  play(async (me, c) => c.json(await getResults(store, me)))
);

async function createPost(day: number): Promise<string> {
  const post = await reddit.submitCustomPost({
    title: `Grout day ${day}: ${contentForDay(day).prompt}`,
  });
  return post.id;
}

const internal = new Hono();

// Runs daily at 12:00 UTC (see devvit.json). A second call inside 12 hours is a no-op.
internal.post('/cron/daily', async (c) => {
  const rolled = await rollover(store, { now: Date.now(), createPost });
  return c.json({ status: 'ok', rolled: rolled !== null });
});

internal.post('/menu/new-day', async (c) => {
  const rolled = await rollover(store, {
    now: Date.now(),
    force: true,
    createPost,
  });
  return c.json<UiResponse>({
    showToast: rolled
      ? `Day ${rolled.day} posted.`
      : 'A new day is already being posted.',
  });
});

internal.post('/triggers/on-app-install', async (c) => {
  if ((await currentDay(store)) === 0) {
    await rollover(store, { now: Date.now(), force: true, createPost });
  }
  return c.json({ status: 'ok' });
});

const app = new Hono();
app.route('/api', api);
app.route('/internal', internal);

// `error` is read by the game client, `showToast` by Reddit for menu actions.
app.onError((err, c) => {
  console.error(err);
  const message = 'Something went wrong. Try again.';
  return c.json({ error: message, showToast: message }, 500);
});

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});
