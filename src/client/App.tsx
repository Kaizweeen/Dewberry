import { useEffect, useRef, useState } from 'react';
import type { Claim, DayView, PetView } from '../shared/types';
import { ApiFailure, api } from './api';
import { ClaimCard } from './screens/ClaimCard';
import { Closed } from './screens/Closed';
import { Draw } from './screens/Draw';
import { Gallery } from './screens/Gallery';
import { Home } from './screens/Home';
import { Inventory } from './screens/Inventory';
import { Menu } from './screens/Menu';
import { Settings } from './screens/Settings';
import type { InventoryTab } from './screens/Inventory';
import { PetPick } from './screens/PetPick';
import { Result } from './screens/Result';
import { homeStep } from './text';
import type { HomeStep } from './text';
import { Stage } from './ui';

type Screen =
  | 'menu'
  | 'home'
  | 'draw'
  | 'gallery'
  | 'result'
  | 'closed'
  | 'inventory'
  | 'settings';

// Where the home page's main button leads, for each step of the day.
const STEP_SCREEN = {
  draw: 'draw',
  hearts: 'gallery',
  mine: 'result',
} as const satisfies Record<HomeStep, Screen>;
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
  const [screen, setScreen] = useState<Screen>('menu');
  const [invTab, setInvTab] = useState<InventoryTab>('clothes');
  // The server hands a claim out once. It is kept here until the player dismisses it.
  const [claim, setClaim] = useState<Claim | null>(null);
  const loadingRef = useRef(false);
  const refreshes = useRef(0);

  // Keeps every claim from any day response. A later `claim: null` never erases it,
  // and a second claim (two answers can each carry different days) is added to the first.
  const keepClaim = (v: DayView) => {
    const got = v.claim;
    if (got === null) return;
    setClaim((kept) =>
      kept === null
        ? got
        : {
            days: [...kept.days, ...got.days],
            items: [...kept.items, ...got.items],
          }
    );
  };

  // An open day starts at the main menu. Coming back from the inventory
  // reloads the day and lands on the pet's home instead.
  const load = (to: 'menu' | 'home' = 'menu') => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setFailure(null);
    api
      .day()
      .then((v) => {
        keepClaim(v);
        setView(v);
        setScreen(v.open ? to : 'closed');
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
    return (
      <Plate {...(final ? {} : { retry: () => load() })}>
        {failure.message}
      </Plate>
    );
  }
  if (view === null) return <Plate status>Loading</Plate>;

  // Result needs a drawing to show. Without one the player goes home.
  const current =
    screen === 'result' && view.myEntry === null ? 'home' : screen;
  // The pick and the claim card come before a screen. The pick is on the grass.
  // A claim that arrives mid-play waits: it never interrupts drawing or the gallery.
  const calm =
    current === 'menu' ||
    current === 'home' ||
    current === 'result' ||
    current === 'closed';
  const openInventory = (tab: InventoryTab) => {
    setInvTab(tab);
    setScreen('inventory');
  };
  const before =
    view.pet === null ? 'pick' : claim !== null && calm ? 'claim' : null;
  // The main menu fills the viewport, so it is drawn outside the stage.
  if (before === null && current === 'menu' && view.pet !== null) {
    return (
      <Menu
        onSettings={() => setScreen('settings')}
        pet={{ id: view.pet, hungry: view.fullness <= 0 }}
        buttons={[
          {
            art: '/art/menu-draw.png',
            label: 'Draw',
            onClick: () => setScreen(STEP_SCREEN[homeStep(view)]),
          },
          {
            art: '/art/menu-pet.png',
            label: 'Your pet',
            onClick: () => setScreen('home'),
          },
        ]}
      />
    );
  }
  return (
    <Stage
      horizon={
        before === 'pick' ||
        (before === null && (current === 'home' || current === 'result'))
          ? 'high'
          : 'low'
      }
    >
      {before === 'pick' && <PetPick onPicked={() => load()} />}
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
      case 'home':
        return (
          <Home
            view={view}
            pet={pet}
            onStep={(step) => setScreen(STEP_SCREEN[step])}
            onFeed={() => openInventory('food')}
            onInventory={() => openInventory('clothes')}
            onPetChanged={(p: PetView) =>
              setView({
                ...view,
                pet: p.pet,
                petName: p.name,
                fullness: p.fullness,
                placed: p.placed,
              })
            }
          />
        );
      case 'draw':
        return (
          <Draw
            view={view}
            onHome={() => setScreen('home')}
            onClosed={showClosed}
            onSubmitted={(result) => {
              setView({
                ...view,
                myEntry: result.entry,
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
            onHome={() => setScreen('home')}
          />
        );
      case 'inventory':
        // Back reloads the day, so the scene shows what changed. A claim card
        // kept in state survives the reload (keepClaim never erases it).
        return <Inventory start={invTab} onBack={() => load('home')} />;
      case 'closed':
        return <Closed view={view} pet={pet} />;
      case 'settings':
        return <Settings onBack={() => setScreen('menu')} />;
      case 'menu':
        // Drawn outside the stage, above.
        return null;
    }
  }
}
