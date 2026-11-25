import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFS, loadPrefs, savePrefs } from './settings';

const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
};

describe('settings', () => {
  it('starts with music and sound effects on', () => {
    expect(loadPrefs(memory())).toEqual({ music: true, sfx: true });
    expect(loadPrefs(null)).toEqual(DEFAULT_PREFS);
  });

  it('remembers what the player chose', () => {
    const store = memory();
    savePrefs({ music: false, sfx: true }, store);
    expect(loadPrefs(store)).toEqual({ music: false, sfx: true });
  });

  it('ignores a saved value it cannot read', () => {
    const store = memory();
    store.setItem('dewberry.prefs', '{nonsense');
    expect(loadPrefs(store)).toEqual(DEFAULT_PREFS);
    store.setItem(
      'dewberry.prefs',
      JSON.stringify({ music: 'no', sfx: false })
    );
    expect(loadPrefs(store)).toEqual({ music: true, sfx: false });
  });

  it('does not throw when storage fails', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadPrefs(broken)).toEqual(DEFAULT_PREFS);
    expect(() => savePrefs(DEFAULT_PREFS, broken)).not.toThrow();
  });
});
