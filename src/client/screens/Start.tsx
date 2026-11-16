import type { DayView } from '../../shared/types';
import { drawingsText, streakText } from '../text';
import { PetScene, vars } from '../ui';

export function Start(props: { view: DayView; onPlay: () => void }) {
  const { view } = props;
  return (
    <>
      <PetScene />
      <div className="px tab t16" style={{ right: 12, top: 12 }}>
        <span>Day {view.day}</span>
      </div>
      <div
        className="px"
        style={{ left: 12, top: 216, width: 351, height: 368 }}
      >
        <div className="stack" style={{ padding: '20px 16px 16px' }}>
          <h1 className="t32 display">Draw {view.prompt}</h1>
          <p className="t16" style={{ marginTop: 14 }}>
            Any colors you like. One line meter for all of them.
          </p>
          <span
            className="meter big"
            style={vars({ '--left': '100%', marginTop: 10, display: 'block' })}
            role="img"
            aria-label="The line meter for today"
          >
            <b></b>
          </span>
          <div className="grow"></div>
          <button
            className="px in btn primary t32"
            style={{ height: 64 }}
            onClick={props.onPlay}
          >
            Play
          </button>
          <p className="meta t16" style={{ marginTop: 12 }}>
            <span>{streakText(view.streak)}</span>
            <span>
              {view.entryCount === 0
                ? 'Be the first'
                : drawingsText(view.entryCount)}
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
