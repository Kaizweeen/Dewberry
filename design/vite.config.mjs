// Serves the project root as static files so design/mockups.html can load the real
// art (public/art) and the font from node_modules. Not part of the game build.
export default {
  root: new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  publicDir: 'public',
  server: { port: 3410, strictPort: true, open: false },
  appType: 'mpa',
};
