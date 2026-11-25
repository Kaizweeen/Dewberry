import { useRef, useState } from 'react';
import { PETS } from '../../shared/pets';
import type { PetId } from '../../shared/pets';
import { ApiFailure, api } from '../api';
import { petLabel } from '../text';
import { Pet, useWide } from '../ui';

// The three pets in a row under the title. On the wide stage they are bigger
// and the row is centered, with the title above it.
const PHONE = {
  scale: 8,
  column: 117,
  first: 12,
  row: 88,
  top: 200,
  title: { left: 12, top: 60, width: 351 },
  reason: { left: 12, top: 350, width: 351 },
} as const;
const DESKTOP = {
  scale: 11,
  column: 200,
  first: 100,
  row: 110,
  top: 170,
  title: { left: 200, top: 56, width: 400 },
  reason: { left: 200, top: 380, width: 400 },
} as const;

/** The first screen for a player with no pet: three pets on the grass, one tap picks. */
export function PetPick(props: { onPicked: () => void }) {
  const L = useWide() ? DESKTOP : PHONE;
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
      <div className="px" style={L.title}>
        <h1 className="t24 display" style={{ padding: 12 }}>
          Pick your pet
        </h1>
      </div>
      {PETS.map((pet, i) => {
        return (
          <button
            key={pet}
            className="pick"
            style={{
              left: L.first + L.column * i,
              top: L.top,
              width: L.column,
            }}
            onClick={() => void pick(pet)}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: L.row,
              }}
            >
              {/* Each pet starts its loop at a different point, so they do not move as one. */}
              <Pet
                pet={pet}
                scale={L.scale}
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
        <div className="px" style={L.reason}>
          <p className="t16" style={{ padding: '8px 12px' }} role="alert">
            {reason}
          </p>
        </div>
      )}
    </>
  );
}
