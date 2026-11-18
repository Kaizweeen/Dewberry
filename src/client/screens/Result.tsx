import { navigateTo } from '@devvit/web/client';
import { DrawingArt } from '../draw/DrawingArt';
import type { PetId } from '../../shared/pets';
import type { DayView } from '../../shared/types';
import { postUrl, streakText } from '../text';
import { Icon, PetScene } from '../ui';

export function Result(props: {
  view: DayView;
  pet: PetId;
  onGiveHearts: () => void;
  onHome: () => void;
}) {
  const { view } = props;
  const left = view.heartsLeft;
  return (
    <>
      <PetScene
        pet={props.pet}
        fullness={view.fullness}
        placed={view.placed}
        name={view.petName}
      />
      <button
        className="artbtn"
        style={{ left: 12, top: 12, width: 44, height: 44 }}
        aria-label="Home"
        onClick={props.onHome}
      >
        <img src="/art/home-btn.png" alt="" />
      </button>
      <div className="px tab t16" style={{ right: 12, top: 12 }}>
        <span>Day {view.day}</span>
      </div>
      <div
        className="px"
        style={{ left: 12, top: 216, width: 351, height: 368 }}
      >
        <div className="stack" style={{ padding: '20px 16px 16px' }}>
          <h1 className="t32 display">Your drawing is in</h1>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 12,
              alignItems: 'flex-start',
            }}
          >
            {/* The owner's easel (32 x 32 art pixels) at 5 times. Its canvas is
                x 15 to 145, y 35 to 130, and the drawing sits inside it. */}
            <div
              style={{
                position: 'relative',
                flex: 'none',
                width: 160,
                height: 160,
              }}
            >
              <img
                src="/art/easel.png"
                alt=""
                style={{ left: 0, top: 0, width: 160, height: 160 }}
              />
              <span
                className="art"
                style={{
                  position: 'absolute',
                  left: 34,
                  top: 36,
                  width: 92,
                  height: 92,
                }}
              >
                {view.myEntry !== null && (
                  <DrawingArt
                    bare
                    replay
                    entry={view.myEntry}
                    label="Your drawing"
                  />
                )}
              </span>
            </div>
            <div className="t16" style={{ display: 'grid', gap: 8 }}>
              <p className="count t24">
                <Icon name="heart" width={28} height={24} />
                {view.myHearts}
                <span className="t16">so far</span>
              </p>
              <p>{streakText(view.streak)}</p>
              <p>Results at 12:00 UTC.</p>
            </div>
          </div>
          <div className="grow"></div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 60px',
              gap: 8,
            }}
          >
            <button
              className="px in btn primary t24"
              style={{ height: 60 }}
              disabled={left === 0}
              onClick={props.onGiveHearts}
            >
              {left === 0
                ? 'All hearts given'
                : `Give ${left} ${left === 1 ? 'heart' : 'hearts'}`}
            </button>
            <button
              className="px in btn"
              style={{ height: 60 }}
              aria-label="Comments"
              onClick={() => navigateTo(postUrl(view.postId))}
            >
              <Icon name="comment" width={28} height={28} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
