# Devvit platform notes

Verified on 2026-11-16 against the official template (`reddit/devvit-template-react` at commit `97a03bb`) and the installed packages (`@devvit/web` 0.15.3, `devvit` 0.15.3). Where these notes and a plan disagree, these notes win.

Source of each fact: **template** means the template's own source, **types** means the `.d.ts` files in `node_modules/@devvit`, **schema** means `node_modules/@devvit/shared-types/schemas/config-file.v1.json`.

## 1. Project layout (template)

- `src/client`: runs in an iframe on reddit.com. Two HTML entrypoints: `splash.html` (inline view in the feed, keep it light) and `game.html` (expanded view).
- `src/server`: Node serverless backend. `index.ts` is the entry.
- `src/shared`: code used by both sides.
- Build output: `dist/client` and `dist/server/index.cjs` (Vite, via the `devvit()` plugin from `@devvit/start/vite`).
- The server framework is **Hono**, not Express.
- `AGENTS.md` house rules: prefer `type` aliases over `interface`, named exports over default exports, never cast types, no inline `<script>` in HTML files.
- TypeScript is strict: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` (off for the server project only), `noUnusedLocals`, `noUnusedParameters`. Indexing an array gives `T | undefined`.

## 2. `devvit.json` (template, schema)

```json
"post": { "dir": "dist/client", "entrypoints": {
  "default": { "inline": true, "entry": "splash.html" },
  "game": { "entry": "game.html" } } },
"server": { "dir": "dist/server", "entry": "index.cjs" },
"menu": { "items": [ { "label": "...", "description": "...", "location": "subreddit",
  "forUserType": "moderator", "endpoint": "/internal/menu/post-create" } ] },
"triggers": { "onAppInstall": "/internal/triggers/on-app-install" },
"scheduler": { "tasks": { "daily": { "endpoint": "/internal/cron/daily", "cron": "0 12 * * *" } } }
```

- Every menu, trigger, form, and scheduler endpoint must match `^/internal/.+`. Requests are POSTed JSON and the response must be JSON.
- The web view can only fetch `/api/` endpoints.
- The `scheduler` block above is from the schema, not the template (the template has no scheduler). Cron is the standard five-part UNIX format (a six-part form with seconds also exists).
- The app `name` is `dewberry`. It must match the app registered on Reddit.

## 3. Server imports (template)

```ts
import { context, redis, reddit, createServer, getServerPort } from '@devvit/web/server';
const { postId, userId, subredditName, username } = context;
```

`context` fields (types, `BaseContext`): `subredditId`, `subredditName`, `userId: T2 | undefined`, `postId: T3 | undefined`, `username: string | undefined`, `postData`, `appName`, `appVersion`, `commentId`, `snoovatar`, `loid`. `userId` is undefined for logged-out viewers.

Server start (template):

```ts
const app = new Hono();
app.route('/api', api);
serve({ fetch: app.fetch, createServer, port: getServerPort() });
```

## 4. Redis (types, `@devvit/redis` `RedisClient.d.ts`)

| Call | Returns |
|---|---|
| `get(key)` | `Promise<string \| undefined>` |
| `set(key, value, options?)` | `Promise<string>` |
| `incrBy(key, n)` | `Promise<number>` |
| `exists(...keys)` | `Promise<number>` |
| `del(...keys)` | `Promise<void>` |
| `hGet(key, field)` | `Promise<string \| undefined>` |
| `hSet(key, { field: value })` | `Promise<number>` |
| `hSetNX(key, field, value)` | `Promise<number>` (1 if set, 0 if the field existed) |
| `hGetAll(key)` | `Promise<Record<string, string>>` |
| `hLen(key)` | `Promise<number>` |
| `hIncrBy(key, field, n)` | `Promise<number>` |
| `hDel(key, fields[])` | `Promise<number>` |
| `zAdd(key, ...{ member, score })` | `Promise<number>` |
| `zIncrBy(key, member, n)` | `Promise<number>` |
| `zScore(key, member)` | `Promise<number \| undefined>` |
| `zRange(key, start, stop, options?)` | `Promise<{ member: string; score: number }[]>` |
| `zCard(key)`, `zRank(key, member)`, `zRem(key, members[])` | number, `number \| undefined`, number |

- **Plain sets do not exist** (no `sAdd`, `sMembers`). Use a hash with `'1'` values.
- Transactions exist (`watch`, `multi`, `exec`). Not needed so far.
- `@devvit/redis/test` exports a `RedisMock`. We use our own in-memory `Store` instead, so game rules never import Devvit.

## 5. Creating a custom post (template, types)

```ts
const post = await reddit.submitCustomPost({ title: 'Day 12: a cat' });
post.id; // T3 id, used in https://reddit.com/r/${context.subredditName}/comments/${post.id}
```

Options (types): `title`, optional `subredditName` (defaults to the current one), `entry` (which entrypoint to show), `postData` (JSON readable later as `context.postData`), and a text fallback for old.reddit.

## 6. Scheduler (schema, types)

Declared in `devvit.json` (see section 2). The task POSTs to its `/internal/...` endpoint with a `TaskRequest` body and expects JSON back (`TaskResponse` is `{}`). `scheduler` from `@devvit/web/server` can also run one-off jobs. Not used yet.

## 7. Menu items (template)

```ts
menu.post('/post-create', async (c) =>
  c.json<UiResponse>({ showToast: 'Created' }, 200));
```

`UiResponse` (from `@devvit/web/shared`): `{ navigateTo?: string | { url }, showToast?: string | { text, appearance? }, showForm? }`.

## 8. Triggers (template, schema)

`"triggers": { "onAppInstall": "/internal/triggers/on-app-install" }`. The handler reads `await c.req.json<OnAppInstallRequest>()` and returns `c.json<TriggerResponse>({...}, 200)`. `onAppUpgrade` also exists.

## 9. Client (template)

```ts
import { navigateTo, context, requestExpandedMode } from '@devvit/web/client';
navigateTo('https://www.reddit.com/r/Devvit');
requestExpandedMode(e.nativeEvent, 'game'); // from a click in the inline view
```

- Never use `window.location`. `window.alert` is unavailable: use `showToast` from `@devvit/web/client`.
- The client fetches the server with plain `fetch('/api/...')`.
- **Not verified:** whether `localStorage` persists inside the post web view. Check in the first playtest. Draft saving must fail soft (try/catch) either way.

## 10. Viewport sizes

**Not verified.** The template and types do not state them. Measure in the first playtest (log `window.innerWidth` and `innerHeight` for the inline and expanded views, on desktop and in the phone app).

## 11. Current username (template)

`await reddit.getCurrentUsername()` returns `string | undefined`. `context.username` also exists on both server and client.

## 12. Commands

| Command | What it does |
|---|---|
| `npm test` | Vitest, runs `src/**/*.test.ts` (added by us, config in `vitest.config.ts`) |
| `npm run test:types` | `tsc --build` across client, server, shared |
| `npm run lint` | ESLint |
| `npm run build` | `vite build` |
| `npm run login` | `devvit login` (owner only) |
| `npm run dev` | `devvit playtest`, live on Reddit (needs login) |
| `npm run deploy`, `npm run launch` | upload, then publish for review |

Node 24 or later is required (`.nvmrc` says 24.18.0; this machine has 24.17.0, which installs and type-checks fine).

There is no local dev port: the playtest runs on reddit.com.

## Still open (needs the owner's Reddit login)

- Run `npm run login` then `npm run dev` and confirm the sample post loads in a test subreddit.
- Register the real app name and put it in `devvit.json`.
- Items 9 (`localStorage`) and 10 (viewport sizes).
