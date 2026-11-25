/** The two switches on the settings panel. Both start on. */
export type Prefs = { music: boolean; sfx: boolean };

export const DEFAULT_PREFS: Prefs = { music: true, sfx: true };

const KEY = 'dewberry.prefs';

type Store = Pick<Storage, 'getItem' | 'setItem'>;

// Storage can be missing or throw (a private window, blocked site data), so a
// failure falls back to the defaults and the page still works for the session.
const safe = (): Store | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** What the player chose last time. Anything unreadable gives the defaults. */
export function loadPrefs(store: Store | null = safe()): Prefs {
  try {
    const raw = store?.getItem(KEY);
    const v: unknown = raw ? JSON.parse(raw) : null;
    if (typeof v !== 'object' || v === null) return DEFAULT_PREFS;
    const p = v as Partial<Record<keyof Prefs, unknown>>;
    return {
      music: typeof p.music === 'boolean' ? p.music : DEFAULT_PREFS.music,
      sfx: typeof p.sfx === 'boolean' ? p.sfx : DEFAULT_PREFS.sfx,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs, store: Store | null = safe()): void {
  try {
    store?.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Not saved. The switch still flips for this visit.
  }
}
