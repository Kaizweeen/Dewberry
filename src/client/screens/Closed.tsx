import { navigateTo } from '@devvit/web/client';
import { useEffect, useRef, useState } from 'react';
import { DrawingArt } from '../draw/DrawingArt';
import type { PetId } from '../../shared/pets';
import type { DayView, Results } from '../../shared/types';
import { api, ApiFailure } from '../api';
import { ordinal } from '../ordinal';
import { drawingsText, postUrl } from '../text';
import { Icon, PET_PX, Pet, vars } from '../ui';

type Place = Results['top'][number];

const SLOTS = [
  // Second place on the left, first in the middle and larger, third on the right.
  { rank: 2, art: 64, pu: 4 },
  { rank: 1, art: 88, pu: 6 },
  { rank: 3, art: 64, pu: 4 },
] as const;

function Podium(props: { top: Place[] }) {
  return (
    <ul
      className="podium t16"
      style={{
        marginTop: 14,
        gap: 8,
        display: 'grid',
        alignItems: 'end',
        gridTemplateColumns: '1fr 1.25fr 1fr',
      }}
    >
      {SLOTS.map((slot) => {
        const place = props.top.find((p) => p.rank === slot.rank);
        if (place === undefined) return <li key={slot.rank}></li>;
        const name = ordinal(slot.rank);
        return (
          <li key={slot.rank}>
            <span className="t24">{name}</span>
            <div
              className="pocket"
              style={vars({ '--pu': `${slot.pu}px`, margin: slot.pu })}
            >
              <span
                className="art paper"
                style={{ width: slot.art, height: slot.art }}
              >
                <DrawingArt
                  entry={place.entry}
                  label={`${name} place drawing`}
                />
              </span>
            </div>
            <span className="who">{place.username}</span>
            <span className="count">
              <Icon name="heart" width={21} height={18} />
              {place.hearts}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// Whole-number scales that keep every pet at most 81 pixels tall (Star is 9).
const CLOSED_SCALE = { star: 9, slime: 8, angel: 9 } as const;

export function Closed(props: { view: DayView; pet: PetId }) {
  const { view } = props;
  const px = PET_PX[props.pet];
  const scale = CLOSED_SCALE[props.pet];
  const [results, setResults] = useState<Results | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const asked = useRef(false);

  const load = () => {
    if (asked.current) return;
    asked.current = true;
    setFailure(null);
    api
      .results()
      .then(setResults)
      .catch((err: unknown) =>
        setFailure(
          err instanceof ApiFailure
            ? err.message
            : 'Something went wrong. Try again.'
        )
      )
      .finally(() => {
        asked.current = false;
      });
  };

  useEffect(load, []);

  const count = results?.count ?? view.entryCount;
  const today = view.todayPostId;

  let placing = '';
  if (failure !== null) placing = failure;
  else if (results !== null) {
    if (results.count === 0) placing = 'Nobody drew that day.';
    else if (results.myRank === null) placing = 'You did not draw that day.';
    else placing = `You placed ${ordinal(results.myRank)} of ${results.count}.`;
  }

  return (
    <>
      <div className="px tab t16" style={{ right: 12, top: 12 }}>
        <span>Day {view.day}</span>
      </div>
      <div
        className="px"
        style={{ left: 12, top: 52, width: 351, height: 440 }}
      >
        <div className="stack" style={{ padding: 16 }}>
          <h1 className="t32 display">{view.prompt}</h1>
          <p className="t16" style={{ marginTop: 6 }}>
            This day is closed. {drawingsText(count)}.
          </p>
          {results !== null && results.count > 0 && (
            <Podium top={results.top} />
          )}
          <div className="grow"></div>
          <p className="t16">{placing}</p>
          {failure !== null && (
            <button
              className="px in btn t24"
              style={{ height: 56, marginTop: 10 }}
              onClick={load}
            >
              Try again
            </button>
          )}
          {today !== null && today !== view.postId && (
            <button
              className="px in btn primary t24"
              style={{ height: 56, marginTop: 10 }}
              onClick={() => navigateTo(postUrl(today))}
            >
              Go to today's post
            </button>
          )}
        </div>
      </div>
      <img
        className="shade bob"
        src="/art/shadow.png"
        alt=""
        style={{ left: 148, top: 566, width: 80, height: 24 }}
      />
      <Pet
        pet={props.pet}
        scale={scale}
        bob
        label={`Your pet, ${view.petName}`}
        style={{
          position: 'absolute',
          left: Math.round(187.5 - (px.w * scale) / 2),
          top: 579 - px.h * scale,
        }}
      />
    </>
  );
}
