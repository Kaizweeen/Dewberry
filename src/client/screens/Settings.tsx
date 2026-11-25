import { exitExpandedMode } from '@devvit/web/client';
import { useState } from 'react';
import { loadPrefs, savePrefs } from '../settings';
import type { Prefs } from '../settings';

// The owner's panel is 63 x 84 art pixels, drawn at 5 times, centered in the
// stage. The two switches and QUIT are drawn into it, so each control is a
// transparent button laid over its picture, in art pixels from the panel's corner.
const S = 5;
const PANEL = { w: 63, h: 84, left: 30, top: 36 };
const px = (n: number) => n * S;

// Each row is one tap target: the label and its switch. `sw` is the switch itself.
const ROWS: { key: keyof Prefs; label: string; y: number }[] = [
  { key: 'music', label: 'Music', y: 17 },
  { key: 'sfx', label: 'Sound effects', y: 34 },
];
const SWITCH = { x: 43, w: 13, h: 9, dy: 1 };

/**
 * The settings: the owner's panel with a switch for music, one for sound
 * effects, and QUIT. The panel draws every switch with its knob on the left.
 * Here the knob on the right means on, so an on switch is that picture
 * mirrored. The choices are remembered, but the game has no sound yet, so the
 * panel says so instead of pretending the switches do something.
 */
export function Settings(props: { onBack: () => void }) {
  const [prefs, setPrefs] = useState(loadPrefs);

  const flip = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    savePrefs(next);
  };

  return (
    <>
      <h1 className="sr-only">Settings</h1>
      <img
        src="/art/settings-panel.png"
        alt=""
        style={{
          left: PANEL.left,
          top: PANEL.top,
          width: px(PANEL.w),
          height: px(PANEL.h),
        }}
      />
      {ROWS.map((row) => (
        <button
          key={row.key}
          className="artbtn"
          role="switch"
          aria-checked={prefs[row.key]}
          aria-label={row.label}
          style={{
            left: PANEL.left + px(5),
            top: PANEL.top + px(row.y),
            width: px(51),
            height: px(11),
          }}
          onClick={() => flip(row.key)}
        >
          {prefs[row.key] && (
            // An on switch: the owner's switch picture, mirrored.
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: px(SWITCH.x - 5),
                top: px(SWITCH.dy),
                width: px(SWITCH.w),
                height: px(SWITCH.h),
                overflow: 'hidden',
                transform: 'scaleX(-1)',
              }}
            >
              <img
                src="/art/settings-panel.png"
                alt=""
                style={{
                  position: 'absolute',
                  left: -px(SWITCH.x),
                  top: -px(row.y + SWITCH.dy),
                  width: px(PANEL.w),
                  height: px(PANEL.h),
                  maxWidth: 'none',
                }}
              />
            </span>
          )}
        </button>
      ))}
      <button
        className="artbtn"
        aria-label="Quit"
        style={{
          left: PANEL.left + px(15),
          top: PANEL.top + px(51),
          width: px(31),
          height: px(12),
        }}
        onClick={(e) => exitExpandedMode(e.nativeEvent)}
      />
      <p
        className="t12"
        style={{
          position: 'absolute',
          left: PANEL.left + px(6),
          top: PANEL.top + px(66),
          width: px(51),
          textAlign: 'center',
        }}
      >
        No sound yet. Your choices are saved for when it arrives.
      </p>
      <div style={{ position: 'absolute', left: 12, top: 504, width: 351 }}>
        <button
          className="px in btn t24"
          style={{ height: 60, width: '100%' }}
          onClick={props.onBack}
        >
          Back
        </button>
      </div>
    </>
  );
}
