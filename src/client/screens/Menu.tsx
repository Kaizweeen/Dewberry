import { useEffect, useState } from 'react';
import type { PetId } from '../../shared/pets';
import { MENU, menuUnits } from '../menuUnits';
import { PET_PX, Pet } from '../ui';

const read = () => menuUnits(window.innerWidth, window.innerHeight);

/** A drawn button: its picture in /art, the name a reader hears, and what it does. */
export type MenuButton = {
  art: string;
  label: string;
  onClick: (e: MouseEvent) => void;
};

/**
 * The owner's menu: the sky, the land, the logo, and a column of drawn buttons
 * under it. It fills the viewport instead of sitting in the stage, so a wide
 * desktop window shows the composition as drawn and a phone restacks the same
 * pieces. The game's menu has DRAW and UR PET with the player's pet beside
 * them. The feed's splash has one PLAY button and no pet.
 */
export function Menu(props: {
  buttons: MenuButton[];
  pet?: { id: PetId; hungry: boolean };
  /** Adds a small Settings button in the corner. */
  onSettings?: () => void;
}) {
  const [units, setUnits] = useState(read);
  useEffect(() => {
    const onResize = () => setUnits(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const { bg, fg, btn } = units;

  // The sky is drawn one step larger than the land, which leaves room for it to drift.
  const sky = bg + 1;
  const skyW = MENU.skyW * sky;
  const landW = MENU.w * bg;

  // The column: logo on top, the buttons centered under it.
  const boxW = MENU.logoW * fg;
  const btnW = MENU.btnW * btn;
  const btnH = MENU.btnH * btn;
  const btnLeft = Math.round((boxW - btnW) / 2);
  const firstTop = MENU.btnTop * fg;
  const topOf = (i: number) => firstTop + i * (MENU.btnH + MENU.btnGap) * btn;
  const boxH = topOf(props.buttons.length - 1) + btnH;

  // The player's pet stands on the grass to the right of the last button (the
  // river runs down the left), feet on the button's bottom edge.
  const pet = props.pet;
  const px = pet && PET_PX[pet.id];
  const petLeft = btnLeft + btnW + 3 * btn;
  const breath = pet?.hungry === true ? 'bob slow' : 'bob';

  return (
    <main className="menu">
      {props.onSettings && (
        <div
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            width: 104,
            height: 44,
            zIndex: 1,
          }}
        >
          <button
            className="px in btn t16"
            style={{ width: '100%', height: '100%' }}
            onClick={props.onSettings}
          >
            Settings
          </button>
        </div>
      )}
      <img
        className="menu-sky"
        src="/art/menu-sky.png"
        alt=""
        style={{
          left: '50%',
          top: 0,
          width: skyW,
          height: MENU.h * sky,
          marginLeft: -Math.round(skyW / 2),
        }}
      />
      <img
        src="/art/menu-land.png"
        alt=""
        style={{
          left: '50%',
          bottom: 0,
          width: landW,
          height: MENU.landH * bg,
          marginLeft: -landW / 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: boxW,
          height: boxH,
          marginLeft: -Math.round(boxW / 2),
          marginTop: -Math.round(boxH / 2),
        }}
      >
        <h1
          className="bob slow"
          style={{ left: 0, top: 0, width: boxW, height: MENU.logoH * fg }}
        >
          <img src="/art/menu-logo.png" alt="Dewberry" />
        </h1>
        {props.buttons.map((b, i) => (
          <button
            key={b.label}
            className="artbtn"
            style={{
              left: btnLeft,
              top: topOf(i),
              width: btnW,
              height: btnH,
              ...(i > 0 ? { animationDelay: `${120 * i}ms` } : {}),
            }}
            aria-label={b.label}
            onClick={(e) => b.onClick(e.nativeEvent)}
          >
            <img src={b.art} alt="" />
          </button>
        ))}
        {pet && px && (
          <>
            <img
              className={`shade ${breath}`}
              src="/art/shadow.png"
              alt=""
              style={{
                left: petLeft + ((px.w - 10) / 2) * btn,
                top: boxH - btn,
                width: 10 * btn,
                height: 3 * btn,
              }}
            />
            <Pet
              pet={pet.id}
              scale={btn}
              mood={pet.hungry ? 'asleep' : 'idle'}
              bob
              style={{
                position: 'absolute',
                left: petLeft,
                top: boxH - px.h * btn,
              }}
            />
          </>
        )}
      </div>
    </main>
  );
}
