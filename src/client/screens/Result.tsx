import { navigateTo } from '@devvit/web/client';
import { DrawingArt } from '../draw/DrawingArt';
import type { PetId } from '../../shared/pets';
import type { DayView } from '../../shared/types';
import { postUrl, streakText } from '../text';
import { Icon, PetScene, vars } from '../ui';

export function Result(props: {
  view: DayView;
  pet: PetId;
  onGiveHearts: () => void;
}) {
  const { view } = props;
  const left = view.heartsLeft;
  return (
    <>
      <PetScene
        pet={props.pet}
        fed={view.fed}
        placed={view.placed}
        name={view.petName}
      />
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
              gap: 18,
              marginTop: 12,
              alignItems: 'flex-start',
            }}
          >
            <div
              className="pocket"
              style={vars({ '--pu': '6px', margin: '6px 0 0 6px' })}
            >
              <span className="art paper" style={{ width: 104, height: 104 }}>
                {view.myEntry !== null && (
                  <DrawingArt entry={view.myEntry} label="Your drawing" />
                )}
              </span>
            </div>
            <div className="t16" style={{ display: 'grid', gap: 8 }}>
              <p className="count t24">
                <Icon name="heart" width={28} height={24} />
                {view.myHearts} so far
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
