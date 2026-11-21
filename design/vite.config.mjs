// Development only. Not part of the game build.
//
// Serves the project root so two things can be opened in a plain browser:
//   /design/mockups.html        the approved screen mockups
//   /src/client/game.html       the real game client, played against the real rules
//
// The game normally runs inside Reddit, where the server needs Reddit's platform. Here the
// same rules (src/server/game.ts) run on the in-memory store, with one made-up player and
// a handful of made-up drawings from other players so the gallery has something to show.
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const ME = 't2_local_me';

// A few simple made-up drawings, as [color, points] lists on the 256 x 256 sheet.
function sampleDrawings() {
  const ring = (cx, cy, r, n = 20) => {
    const p = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      p.push(
        Math.round(cx + Math.cos(a) * r),
        Math.round(cy + Math.sin(a) * r)
      );
    }
    return p;
  };
  const zig = (y, amp) => {
    const p = [];
    for (let i = 0; i <= 8; i++) p.push(40 + i * 22, y + (i % 2 ? amp : -amp));
    return p;
  };
  const box = (x, y, w, h) => [x, y, x + w, y, x + w, y + h, x, y + h, x, y];
  const colors = [
    '#c8403c',
    '#f2a81d',
    '#5a3a22',
    '#5b9bd5',
    '#3f8f4f',
    '#7b4fa3',
  ];
  const out = [];
  for (let i = 0; i < 20; i++) {
    const a = colors[i % colors.length];
    const b = colors[(i + 2) % colors.length];
    const shapes = [
      [
        { c: a, p: ring(128, 120, 50 + (i % 4) * 8) },
        { c: b, p: ring(128, 120, 16) },
      ],
      [
        { c: a, p: box(70, 70, 110, 100) },
        { c: b, p: zig(200, 10) },
      ],
      [
        { c: a, p: zig(90, 14) },
        { c: b, p: zig(130, 14) },
        { c: a, p: zig(170, 14) },
      ],
      [
        { c: a, p: ring(96, 150, 34) },
        { c: a, p: ring(170, 150, 34) },
        { c: b, p: [96, 116, 132, 60, 170, 116] },
      ],
    ];
    out.push(JSON.stringify(shapes[i % shapes.length]));
  }
  return out;
}

function localGame() {
  return {
    name: 'local-game',
    configureServer(server) {
      let world = null;
      let viewDay = 1;

      async function boot() {
        const game = await server.ssrLoadModule('/src/server/game.ts');
        const pets = await server.ssrLoadModule('/src/server/pets.ts');
        const { keys } = await server.ssrLoadModule('/src/server/store.ts');
        const { memoryStore } = await server.ssrLoadModule(
          '/src/server/memoryStore.ts'
        );
        const store = memoryStore();
        const createPost = async (day) => `t3_local${day}`;
        await game.rollover(store, {
          now: Date.now(),
          force: true,
          createPost,
        });
        const drawings = sampleDrawings();
        for (let i = 0; i < drawings.length; i++) {
          await game.submitEntry(store, {
            day: 1,
            userId: `t2_other${i}`,
            username: `sample_player_${i + 1}`,
            entry: drawings[i],
            now: Date.now() + i,
          });
        }
        viewDay = 1;
        return { game, pets, keys, store, createPost };
      }

      const send = (res, status, body) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      };
      const readBody = (req) =>
        new Promise((resolve) => {
          let data = '';
          req.on('data', (chunk) => (data += chunk));
          req.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(null);
            }
          });
        });

      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        if (!url.startsWith('/api/') && !url.startsWith('/dev/')) return next();
        try {
          if (!world || url === '/dev/reset') world = await boot();
          const { game, pets, keys, store, createPost } = world;
          const me = { userId: ME, postId: `t3_local${viewDay}`, day: viewDay };

          if (url === '/dev/reset') return send(res, 200, { ok: true });
          if (url === '/dev/next-day') {
            // Close the current day and open the next one. The page keeps showing the old post.
            const rolled = await game.rollover(store, {
              now: Date.now(),
              force: true,
              createPost,
            });
            return send(res, 200, { rolled, viewing: viewDay });
          }
          if (url === '/dev/streak') {
            // Set the local player's best streak so pet unlocks can be tried.
            const body = await readBody(req);
            await store.hSet(keys.player(ME), {
              best: String(Number(body?.best) || 0),
            });
            return send(res, 200, { ok: true });
          }
          if (url === '/dev/view-today') {
            // Show the current day's post, so the day after can be played.
            viewDay = await game.currentDay(store);
            return send(res, 200, { viewing: viewDay });
          }
          if (url === '/dev/hearts') {
            // Give the local player's drawing a few hearts from other players.
            const body = await readBody(req);
            for (let i = 0; i < (body?.count ?? 3); i++) {
              await game.heartEntry(store, {
                day: viewDay,
                userId: `t2_other${i}`,
                targetId: ME,
              });
            }
            return send(res, 200, { ok: true });
          }
          if (url === '/api/day')
            return send(res, 200, await game.getDayView(store, me));
          if (url === '/api/entry') {
            const body = await readBody(req);
            const result = await game.submitEntry(store, {
              day: me.day,
              userId: me.userId,
              username: 'local_me',
              entry: body?.entry,
              now: Date.now(),
            });
            return send(
              res,
              result.ok ? 200 : result.error === 'closed' ? 409 : 400,
              result
            );
          }
          if (url === '/api/gallery') {
            const page = await game.getGalleryPage(store, me);
            if (!page)
              return send(res, 409, { error: 'Submit your drawing first.' });
            return send(res, 200, page);
          }
          if (url === '/api/heart') {
            const body = await readBody(req);
            const result = await game.heartEntry(store, {
              day: me.day,
              userId: me.userId,
              targetId: typeof body?.targetId === 'string' ? body.targetId : '',
            });
            return send(res, result.ok ? 200 : 409, result);
          }
          if (url === '/api/pet')
            return send(res, 200, await pets.getPetView(store, ME));
          if (url === '/api/pet/update') {
            const body = await readBody(req);
            const result = await pets.updatePet(store, {
              userId: ME,
              action: body?.action,
            });
            return send(res, result.ok ? 200 : 400, result);
          }
          if (url === '/api/results')
            return send(res, 200, await game.getResults(store, me));
          return send(res, 404, { error: 'Not found.' });
        } catch (err) {
          console.error(err);
          return send(res, 500, { error: 'Something went wrong. Try again.' });
        }
      });
    },
  };
}

export default {
  root,
  publicDir: 'public',
  plugins: [react(), tailwind(), localGame()],
  resolve: {
    alias: {
      // Reddit's client module only works inside a Reddit post.
      '@devvit/web/client': fileURLToPath(
        new URL('./reddit-client-stub.js', import.meta.url)
      ),
    },
  },
  server: { port: 3410, strictPort: true, open: false },
  appType: 'mpa',
};
