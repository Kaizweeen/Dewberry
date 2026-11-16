import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { PET_NAME_MAX } from '../../shared/pets';
import type { PetId } from '../../shared/pets';
import type { DayView, PetView } from '../../shared/types';
import { ApiFailure, api } from '../api';
import { drawingsText, streakText } from '../text';
import { PetScene, vars } from '../ui';

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

export function Start(props: {
  view: DayView;
  pet: PetId;
  onPlay: () => void;
  onPetChanged: (pet: PetView) => void;
  onInventory?: () => void;
}) {
  const { view } = props;
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
      <PetScene
        pet={props.pet}
        fed={view.fed}
        placed={view.placed}
        name={view.petName}
        {...(props.onInventory === undefined
          ? {}
          : { onPet: props.onInventory })}
      />
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
