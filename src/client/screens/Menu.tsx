import { useEffect, useState } from 'react';
import type { PetId } from '../../shared/pets';
import { MENU, menuUnits } from '../menuUnits';
import { PET_PX, Pet } from '../ui';

const read = () => menuUnits(window.innerWidth, window.innerHeight);

/**
 * The main menu: the owner's sky, land, logo, and two buttons. It fills the
 * viewport instead of sitting in the stage, so a wide desktop window shows the
 * composition as drawn and a phone restacks the same pieces.
 */
export function Menu(props: {
  pet: PetId;
  hungry: boolean;
  onDraw: () => void;
  onPet: () => void;
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
  const drawTop = MENU.btnTop * fg;
  const petTop = drawTop + (MENU.btnH + MENU.btnGap) * btn;
  const boxH = petTop + btnH;

  // The player's pet stands on the grass to the right of UR PET (the river
  // runs down the left), feet on the button's bottom edge.
  const px = PET_PX[props.pet];
  const petLeft = btnLeft + btnW + 3 * btn;
  const breath = props.hungry ? 'bob slow' : 'bob';

  return (
    <main className="menu">
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
        <button
          className="artbtn"
          style={{ left: btnLeft, top: drawTop, width: btnW, height: btnH }}
          aria-label="Draw"
          onClick={props.onDraw}
        >
          <img src="/art/menu-draw.png" alt="" />
        </button>
        <button
          className="artbtn"
          style={{
            left: btnLeft,
            top: petTop,
            width: btnW,
            height: btnH,
            animationDelay: '120ms',
          }}
          aria-label="Your pet"
          onClick={props.onPet}
        >
          <img src="/art/menu-pet.png" alt="" />
        </button>
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
          pet={props.pet}
          scale={btn}
          mood={props.hungry ? 'asleep' : 'idle'}
          bob
          style={{
            position: 'absolute',
            left: petLeft,
            top: boxH - px.h * btn,
          }}
        />
      </div>
    </main>
  );
}
