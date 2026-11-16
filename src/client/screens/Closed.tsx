import { navigateTo } from '@devvit/web/client';
import { useEffect, useRef, useState } from 'react';
import { DrawingArt } from '../draw/DrawingArt';
import type { DayView, Results } from '../../shared/types';
import { api, ApiFailure } from '../api';
import { ordinal } from '../ordinal';
import { drawingsText, postUrl } from '../text';
import { Icon, Stage, vars } from '../ui';

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

export function Closed(props: { view: DayView }) {
  const { view } = props;
  const [results, setResults] = useState<Results | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current) return;
    asked.current = true;
    api
      .results()
      .then(setResults)
      .catch((err: unknown) =>
        setFailure(
          err instanceof ApiFailure
            ? err.message
            : 'Something went wrong. Try again.'
        )
      );
  }, []);

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
    <Stage>
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
        src="/art/shadow.png"
        alt=""
        style={{ left: 148, top: 566, width: 80, height: 24 }}
      />
      <img
        src="/art/star.png"
        alt="Your pet, Star"
        style={{ left: 147, top: 498, width: 81, height: 81 }}
      />
    </Stage>
  );
}
