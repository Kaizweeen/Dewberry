import { useEffect, useRef, useState } from 'react';
import type { Claim, DayView, PetView } from '../shared/types';
import { ApiFailure, api } from './api';
import { ClaimCard } from './screens/ClaimCard';
import { Closed } from './screens/Closed';
import { Draw } from './screens/Draw';
import { Gallery } from './screens/Gallery';
import { PetPick } from './screens/PetPick';
import { Result } from './screens/Result';
import { Start } from './screens/Start';
import { Stage } from './ui';

type Screen = 'start' | 'draw' | 'gallery' | 'result' | 'closed';
type Failure = { status: number; message: string };

const toFailure = (err: unknown): Failure =>
  err instanceof ApiFailure
    ? { status: err.status, message: err.message }
    : { status: 0, message: 'Something went wrong. Try again.' };

function Plate(props: {
  children: string;
  retry?: () => void;
  status?: boolean;
}) {
  return (
    <Stage>
      <div className="px" style={{ left: 12, top: 216, width: 351 }}>
        <div style={{ display: 'grid', gap: 12, padding: 12 }}>
          <p
            className="t24 display"
            {...(props.status === true ? { role: 'status' } : {})}
          >
            {props.children}
          </p>
          {props.retry !== undefined && (
            <button
              className="px in btn primary t24"
              style={{ height: 56 }}
              onClick={props.retry}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </Stage>
  );
}

export function App() {
  const [view, setView] = useState<DayView | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [screen, setScreen] = useState<Screen>('start');
  // The server hands a claim out once. It is kept here until the player dismisses it.
  const [claim, setClaim] = useState<Claim | null>(null);
  const loadingRef = useRef(false);
  const refreshes = useRef(0);

  // Keeps the first claim from any day response. A later `claim: null` never erases it.
  const keepClaim = (v: DayView) => {
    if (v.claim !== null) setClaim((kept) => kept ?? v.claim);
  };

  const load = () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setFailure(null);
    api
      .day()
      .then((v) => {
        keepClaim(v);
        setView(v);
        setScreen(
          v.open ? (v.myEntry === null ? 'start' : 'result') : 'closed'
        );
      })
      .catch((err: unknown) => setFailure(toFailure(err)))
      .finally(() => {
        loadingRef.current = false;
      });
  };

  useEffect(load, []);

  // Keeps hearts and streak current without changing the screen.
  // Only the newest refresh is applied. A failure changes nothing.
  const refresh = () => {
    const mine = ++refreshes.current;
    api
      .day()
      .then((v) => {
        // A stale answer may carry the one-time claim, so keep it before the check.
        keepClaim(v);
        if (mine === refreshes.current) setView(v);
      })
      .catch(() => {
        // The numbers stay as they were. The next refresh tries again.
      });
  };

  const showClosed = () => {
    api
      .day()
      .then((v) => {
        keepClaim(v);
        setView(v);
        setScreen('closed');
      })
      .catch((err: unknown) => {
        setView(null);
        setFailure(toFailure(err));
      });
  };

  if (failure !== null) {
    const final = failure.status === 401 || failure.status === 404;
    return <Plate {...(final ? {} : { retry: load })}>{failure.message}</Plate>;
  }
  if (view === null) return <Plate status>Loading</Plate>;

  // Result needs a drawing to show. Without one the player starts at Start.
  const current =
    screen === 'result' && view.myEntry === null ? 'start' : screen;
  // The pick and the claim card come before any screen. The pick is on the grass.
  const before = view.pet === null ? 'pick' : claim !== null ? 'claim' : null;
  return (
    <Stage
      horizon={
        before === 'pick' ||
        (before === null && (current === 'start' || current === 'result'))
          ? 'high'
          : 'low'
      }
    >
      {before === 'pick' && <PetPick onPicked={load} />}
      {before === 'claim' && claim !== null && (
        <ClaimCard claim={claim} onDone={() => setClaim(null)} />
      )}
      {before === null && screenFor(current)}
    </Stage>
  );

  function screenFor(shown: Screen) {
    if (view === null || view.pet === null) return null;
    const pet = view.pet;
    switch (shown) {
      case 'start':
        return (
          <Start
            view={view}
            pet={pet}
            onPlay={() => setScreen('draw')}
            onPetChanged={(p: PetView) =>
              setView({
                ...view,
                pet: p.pet,
                petName: p.name,
                placed: p.placed,
              })
            }
          />
        );
      case 'draw':
        return (
          <Draw
            view={view}
            onHome={() => setScreen('start')}
            onClosed={showClosed}
            onSubmitted={(result) => {
              setView({
                ...view,
                myEntry: result.entry,
                fed: true,
                streak: result.streak,
                entryCount: view.entryCount + 1,
              });
              setScreen('gallery');
              refresh();
            }}
          />
        );
      case 'gallery':
        return (
          <Gallery
            view={view}
            onClosed={showClosed}
            onDone={(heartsLeft) => {
              setView({ ...view, heartsLeft });
              setScreen('result');
              refresh();
            }}
          />
        );
      case 'result':
        return (
          <Result
            view={view}
            pet={pet}
            onGiveHearts={() => setScreen('gallery')}
          />
        );
      case 'closed':
        return <Closed view={view} pet={pet} />;
    }
  }
}
