import { navigateTo } from '@devvit/web/client';
import { useEffect, useRef, useState } from 'react';
import { DrawingArt } from '../draw/DrawingArt';
import type { PetId } from '../../shared/pets';
import type { DayView, Results } from '../../shared/types';
import { api, ApiFailure } from '../api';
import { ordinal } from '../ordinal';
import { drawingsText, postUrl } from '../text';
import { Icon, PET_PX, Pet, useWide } from '../ui';

type Place = Results['top'][number];

// The owner's podium, in art pixels at `k` screen pixels each (3 on the phone,
// 4 on the wide stage). The stage is 96 wide, shown 60 rows tall on the phone
// and 56 on the wide stage (the pillars run off its bottom edge). The pillars are 82
// wide, centered on the stage. `cx` is the middle of a pillar's top and `top` its
// top edge. Each pillar has room above it, under its floating number, for a
// drawing `card` art pixels wide. Second place stands on the left, first in the
// middle and highest, third on the right.
const STAGE = { w: 96, inset: 7 };
const PILLARS = [
  { rank: 2, cx: 12, top: 41, card: 16 },
  { rank: 1, cx: 40, top: 27, card: 20 },
  { rank: 3, cx: 69, top: 49, card: 16 },
] as const;

function Podium(props: { top: Place[]; k: number; rows: number }) {
  const { k: K } = props;
  const mid = (cx: number) => (STAGE.inset + cx) * K;
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          position: 'relative',
          width: STAGE.w * K,
          height: props.rows * K,
          margin: '0 auto',
          overflow: 'hidden',
          imageRendering: 'pixelated',
        }}
      >
        <img
          src="/art/podium-stage.png"
          alt=""
          style={{ left: 0, top: 0, width: STAGE.w * K, height: 73 * K }}
        />
        <img
          src="/art/podium-pillars.png"
          alt=""
          style={{
            left: STAGE.inset * K,
            top: 0,
            width: 82 * K,
            height: 76 * K,
          }}
        />
        {PILLARS.map((p) => {
          const place = props.top.find((t) => t.rank === p.rank);
          if (place === undefined) return null;
          const size = p.card * K;
          return (
            <span
              key={p.rank}
              className="art card framed paper"
              style={{
                left: mid(p.cx) - size / 2,
                top: p.top * K - size + K,
                width: size,
                height: size,
              }}
            >
              <DrawingArt
                entry={place.entry}
                label={`${ordinal(p.rank)} place drawing`}
              />
            </span>
          );
        })}
      </div>
      <ul
        className="t12"
        style={{
          position: 'relative',
          width: STAGE.w * K,
          height: 34,
          margin: '6px auto 0',
        }}
      >
        {PILLARS.map((p) => {
          const place = props.top.find((t) => t.rank === p.rank);
          if (place === undefined) return null;
          return (
            <li
              key={p.rank}
              style={{
                position: 'absolute',
                top: 0,
                left: mid(p.cx) - 40,
                width: 80,
                display: 'grid',
                justifyItems: 'center',
              }}
            >
              <span className="who clip">{place.username}</span>
              <span className="count">
                <Icon name="heart" width={14} height={12} />
                {place.hearts}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Whole-number scales that keep every pet at most 81 pixels tall (Star is 9).
const CLOSED_SCALE = { star: 9, slime: 8, angel: 9 } as const;

export function Closed(props: { view: DayView; pet: PetId }) {
  const { view } = props;
  const wide = useWide();
  // On the wide stage the panel takes the left side and the pet stands on the
  // meadow to its right. On the phone the pet stands under the panel.
  const panel = wide
    ? { left: 12, top: 12, width: 500, height: 476 }
    : { left: 12, top: 52, width: 351, height: 440 };
  const stand = wide
    ? { x: 662, feet: 440, shade: 440 - 13 }
    : { x: 187.5, feet: 579, shade: 566 };
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
      <div className="px" style={panel}>
        <div className="stack" style={{ padding: 16 }}>
          <h1 className="t32 display">{view.prompt}</h1>
          <p className="t16" style={{ marginTop: 6 }}>
            This day is closed. {drawingsText(count)}.
          </p>
          {results !== null && results.count > 0 && (
            <Podium top={results.top} k={wide ? 4 : 3} rows={wide ? 56 : 60} />
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
        style={{ left: stand.x - 40, top: stand.shade, width: 80, height: 24 }}
      />
      <Pet
        pet={props.pet}
        scale={scale}
        bob
        label={`Your pet, ${view.petName}`}
        style={{
          position: 'absolute',
          left: Math.round(stand.x - (px.w * scale) / 2),
          top: stand.feet - px.h * scale,
        }}
      />
    </>
  );
}
