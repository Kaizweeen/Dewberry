// Development only. Stands in for Reddit's client module when the game is opened
// in a plain browser through design/vite.config.mjs. It records what the game asked
// for instead of doing it, so the local check can see it.

export const context = { username: 'local_me' };

export function navigateTo(url) {
  window.__lastNavigateTo = url;
  console.info('navigateTo', url);
}

export function requestExpandedMode(_event, entry) {
  window.__lastExpanded = entry;
  window.location.assign('/src/client/game.html');
}

export function exitExpandedMode(_event) {
  window.__exited = true;
  console.info('exitExpandedMode');
}

export function showToast(message) {
  console.info('showToast', message);
}
