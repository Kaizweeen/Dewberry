import { useRef, useState } from 'react';
import { PETS } from '../../shared/pets';
import type { PetId } from '../../shared/pets';
import { ApiFailure, api } from '../api';
import { petLabel } from '../text';
import { Pet } from '../ui';

const SCALE = 8;
const COLUMN = 117;
const SPRITE_ROW = 88;

/** The first screen for a player with no pet: three pets on the grass, one tap picks. */
export function PetPick(props: { onPicked: () => void }) {
  const [reason, setReason] = useState<string | null>(null);
  const busy = useRef(false);

  const pick = async (pet: PetId) => {
    if (busy.current) return;
    busy.current = true;
    setReason(null);
    try {
      const result = await api.updatePet({ type: 'pick', pet });
      if (result.ok) props.onPicked();
      else setReason(result.reason);
    } catch (err) {
      setReason(
        err instanceof ApiFailure
          ? err.message
          : 'Something went wrong. Try again.'
      );
    } finally {
      busy.current = false;
    }
  };

  return (
    <>
      <div className="px" style={{ left: 12, top: 60, width: 351 }}>
        <h1 className="t24 display" style={{ padding: 12 }}>
          Pick your pet
        </h1>
      </div>
      {PETS.map((pet, i) => {
        return (
          <button
            key={pet}
            className="pick"
            style={{ left: 12 + COLUMN * i, top: 200, width: COLUMN }}
            onClick={() => void pick(pet)}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: SPRITE_ROW,
              }}
            >
              {/* Each pet starts its loop at a different point, so they do not move as one. */}
              <Pet
                pet={pet}
                scale={SCALE}
                bob
                style={{ animationDelay: `${-900 * i}ms` }}
              />
            </span>
            <span className="px in t16">
              <span style={{ display: 'block', padding: '4px 12px' }}>
                {petLabel(pet)}
              </span>
            </span>
          </button>
        );
      })}
      {reason !== null && (
        <div className="px" style={{ left: 12, top: 350, width: 351 }}>
          <p className="t16" style={{ padding: '8px 12px' }} role="alert">
            {reason}
          </p>
        </div>
      )}
    </>
  );
}
