import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { PET_NAME_MAX } from '../../shared/pets';
import type { PetId } from '../../shared/pets';
import type { DayView, PetView } from '../../shared/types';
import { ApiFailure, api } from '../api';
import { drawingsText, homeLine, homeStep, streakText } from '../text';
import type { HomeStep } from '../text';
import { Fullness, Origin, PetScene, WIDE_SCENE, useWide } from '../ui';

// The nameplate (41 x 11 art pixels) at 4 times, with the edit button beside it.
// Its interior is x 8 to 156, y 8 to 36, which hides the label baked into the art.
const PLATE = { left: 79, top: 168, width: 164, height: 44 };
const EDIT = { left: 251, top: 168, width: 44, height: 44 };
const INNER = {
  left: PLATE.left + 8,
  top: PLATE.top + 8,
  width: 148,
  height: 28,
};
// Fullness sits in the gap to the left of the nameplate, on its own small plate.
const BERRIES = { left: 12, top: 168, width: 60, height: 44 };

const MAIN: Record<HomeStep, string> = {
  draw: 'Draw today',
  hearts: 'Give hearts',
  mine: 'Your drawing',
};

/** The pet's home: where every open day starts and where every screen leads back. */
export function Home(props: {
  view: DayView;
  pet: PetId;
  onStep: (step: HomeStep) => void;
  onFeed: () => void;
  onInventory: () => void;
  onPetChanged: (pet: PetView) => void;
}) {
  const { view } = props;
  // On the wide stage the pet's scene stands in the left half and the day's
  // panel fills the right half. On the phone the panel sits under the scene.
  const wide = useWide();
  const at = wide ? WIDE_SCENE : { x: 0, y: 0 };
  const panel = wide
    ? { left: 412, top: 52, width: 376, height: 436 }
    : { left: 12, top: 216, width: 351, height: 368 };
  const step = homeStep(view);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);

  const edit = () => {
    setDraft(view.petName);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    if (saving.current) return;
    saving.current = true;
    setError(null);
    try {
      const result = await api.updatePet({ type: 'name', name: draft });
      if (result.ok) {
        props.onPetChanged(result.pet);
        setEditing(false);
      } else {
        setError(result.reason);
      }
    } catch (err) {
      setError(
        err instanceof ApiFailure
          ? err.message
          : 'Something went wrong. Try again.'
      );
    } finally {
      saving.current = false;
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <>
      <Origin x={at.x} y={at.y}>
        <PetScene
          pet={props.pet}
          fullness={view.fullness}
          placed={view.placed}
          name={view.petName}
          onPet={props.onInventory}
        />
        <div className="px" style={BERRIES}>
          <Fullness full={view.fullness} name={view.petName} size={14} />
        </div>
        <img
          src="/art/nameplate.png"
          alt=""
          style={{
            left: PLATE.left,
            top: PLATE.top,
            width: PLATE.width,
            height: PLATE.height,
          }}
        />
        {editing ? (
          <>
            <input
              className="namebox"
              style={INNER}
              aria-label="Pet name"
              maxLength={PET_NAME_MAX}
              value={draft}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
            />
            <button
              className="px btn t12"
              style={{ ...EDIT, width: 52 }}
              onClick={() => void save()}
            >
              Save
            </button>
          </>
        ) : (
          <>
            <span className="namebox" style={INNER}>
              {view.petName}
            </span>
            <button
              className="artbtn"
              style={EDIT}
              aria-label="Edit pet name"
              onClick={edit}
            >
              <img src="/art/edit-btn.png" alt="" />
            </button>
          </>
        )}
      </Origin>
      {error !== null && (
        <div className="px" style={{ left: 12, top: 12, width: 227 }}>
          <p className="t12" style={{ padding: '8px 12px' }} role="alert">
            {error}
          </p>
        </div>
      )}
      <div className="px tab t16" style={{ right: 12, top: 12 }}>
        <span>Day {view.day}</span>
      </div>
      <div className="px" style={panel}>
        <div className="stack" style={{ padding: '20px 16px 16px' }}>
          <h1 className="t32 display">
            {step === 'draw' ? 'Draw' : 'Today:'} {view.prompt}
          </h1>
          <p className="t16" style={{ marginTop: 14 }}>
            {homeLine(step, view.heartsLeft)}
          </p>
          <div className="grow"></div>
          <button
            className="px in btn primary t32"
            style={{ height: 64 }}
            onClick={() => props.onStep(step)}
          >
            {MAIN[step]}
          </button>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 3fr',
              gap: 8,
              marginTop: 8,
            }}
          >
            <button
              className="px in btn t24"
              style={{ height: 56 }}
              onClick={props.onFeed}
            >
              Feed
            </button>
            <button
              className="px in btn t24"
              style={{ height: 56 }}
              onClick={props.onInventory}
            >
              Inventory
            </button>
          </div>
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
