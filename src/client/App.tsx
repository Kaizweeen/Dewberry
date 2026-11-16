import { useEffect, useRef, useState } from 'react';
import type { DayView } from '../shared/types';
import { ApiFailure, api } from './api';
import { Closed } from './screens/Closed';
import { Draw } from './screens/Draw';
import { Gallery } from './screens/Gallery';
import { Result } from './screens/Result';
import { Start } from './screens/Start';
import { Stage } from './ui';

type Screen = 'start' | 'draw' | 'gallery' | 'result' | 'closed';
type Failure = { status: number; message: string };

const toFailure = (err: unknown): Failure =>
  err instanceof ApiFailure
    ? { status: err.status, message: err.message }
    : { status: 0, message: 'Something went wrong. Try again.' };

function Plate(props: { children: string; retry?: () => void }) {
  return (
    <Stage>
      <div className="px" style={{ left: 12, top: 216, width: 351 }}>
        <div style={{ display: 'grid', gap: 12, padding: 12 }}>
          <p className="t24 display">{props.children}</p>
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
  const loadingRef = useRef(false);

  const load = () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setFailure(null);
    api
      .day()
      .then((v) => {
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
  const refresh = () => {
    api
      .day()
      .then(setView)
      .catch(() => {
        // The numbers stay as they were. The next refresh tries again.
      });
  };

  const showClosed = () => {
    api
      .day()
      .then((v) => {
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
  if (view === null) return <Plate>Loading</Plate>;

  switch (screen) {
    case 'start':
      return <Start view={view} onPlay={() => setScreen('draw')} />;
    case 'draw':
      return (
        <Draw
          view={view}
          onHome={() => setScreen('start')}
          onClosed={showClosed}
          onSubmitted={() => {
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
          onDone={() => {
            setScreen('result');
            refresh();
          }}
        />
      );
    case 'result':
      return <Result view={view} onGiveHearts={() => setScreen('gallery')} />;
    case 'closed':
      return <Closed view={view} />;
  }
}
