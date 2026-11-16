import { useEffect, useRef, useState } from 'react';
import { PETS } from '../../shared/pets';
import type { PetId } from '../../shared/pets';
import type { Item, PetAction, PetView } from '../../shared/types';
import { ApiFailure, api } from '../api';
import { DrawingArt } from '../draw/DrawingArt';
import { pageCount, pageSlice, petLabel, unlockLine } from '../text';
import { Icon, PET_PX } from '../ui';

const GENERIC = 'Something went wrong. Try again.';
const messageOf = (err: unknown): string =>
  err instanceof ApiFailure ? err.message : GENERIC;

type Tab = 'food' | 'clothes' | 'scenery' | 'pets';

// The four dot groups on panel.png sit in art row 1, at columns 2 to 6, 9 to 13,
// 16 to 20 and 23 to 27 (the panel is drawn at 12 times, left 2, top 62). Each
// button is centered on its group, 68 x 44, with 16px between neighbors.
const TABS: { id: Tab; name: string; left: number }[] = [
  { id: 'food', name: 'Food', left: 22 },
  { id: 'clothes', name: 'Clothes', left: 106 },
  { id: 'scenery', name: 'Scenery', left: 190 },
  { id: 'pets', name: 'Pets', left: 274 },
];

const pocket = (i: number) => ({
  left: 2 + (3 + 7 * (i % 4)) * 12,
  top: 62 + (4 + 7 * Math.floor(i / 4)) * 12,
  width: 48,
  height: 48,
});

const placedIds = (pv: PetView): ReadonlySet<string> =>
  new Set(
    [
      pv.placed.food,
      pv.placed.clothes,
      pv.placed.sceneryBack,
      pv.placed.sceneryFront,
    ].flatMap((item) => (item === null ? [] : [item.id]))
  );

/** The inventory: the waffle panel holds what the player owns, four tabs sort it. */
export function Inventory(props: { onBack: () => void }) {
  const [pv, setPv] = useState<PetView | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('food');
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const busy = useRef(false);

  const load = () => {
    setFailed(null);
    api
      .pet()
      .then(setPv)
      .catch((err: unknown) => setFailed(messageOf(err)));
  };
  useEffect(load, []);

  const run = async (action: PetAction) => {
    if (busy.current) return;
    busy.current = true;
    setNote(null);
    try {
      const result = await api.updatePet(action);
      if (result.ok) setPv(result.pet);
      else setNote(result.reason);
    } catch (err) {
      setNote(messageOf(err));
    } finally {
      busy.current = false;
    }
  };

  const back = (
    <button
      className="px in btn t24"
      style={{ height: 60 }}
      onClick={props.onBack}
    >
      Back
    </button>
  );

  if (pv === null) {
    return (
      <>
        <div className="px" style={{ left: 12, top: 216, width: 351 }}>
          <div style={{ display: 'grid', gap: 12, padding: 12 }}>
            <p
              className="t24 display"
              {...(failed === null ? { role: 'status' } : { role: 'alert' })}
            >
              {failed ?? 'Loading'}
            </p>
            {failed !== null && (
              <button
                className="px in btn primary t24"
                style={{ height: 56 }}
                onClick={load}
              >
                Try again
              </button>
            )}
          </div>
        </div>
        <div style={{ position: 'absolute', left: 12, top: 504, width: 351 }}>
          {back}
        </div>
      </>
    );
  }

  const placed = placedIds(pv);
  const onPets = tab === 'pets';
  const items: Item[] = onPets
    ? []
    : pv.items.filter((i) => i.category === tab);
  const pages = onPets ? 1 : pageCount(items.length);
  const at = Math.min(page, pages - 1);
  const shown = pageSlice(items, at);
  const tabName = TABS.find((t) => t.id === tab)?.name ?? '';
  const freeSlot = pv.unlocked.length < pv.slots;

  const choose = (id: Tab) => {
    setTab(id);
    setPage(0);
    setSel(null);
    setNote(null);
  };
  const select = (id: string) => {
    setSel(id);
    setNote(null);
  };

  // What the plate under the panel says, and the one cream button (if any).
  const item = onPets ? undefined : items.find((i) => i.id === sel);
  const pet = onPets ? PETS.find((p) => p === sel) : undefined;
  let text = 'Tap a drawing to see it.';
  let action: { label: string; go: () => void } | null = null;
  if (onPets) {
    text = 'Tap a pet.';
    if (pet !== undefined) {
      const mine = pet === pv.pet;
      const owned = pv.unlocked.includes(pet);
      if (mine) text = `${petLabel(pet)} is your pet now.`;
      else if (owned) {
        text = `${petLabel(pet)} is unlocked.`;
        action = {
          label: 'Switch',
          go: () => void run({ type: 'pick', pet }),
        };
      } else if (freeSlot) {
        text = `${petLabel(pet)} is waiting for you.`;
        action = {
          label: 'Unlock',
          go: () => void run({ type: 'pick', pet }),
        };
      } else {
        text = unlockLine(pv.slots);
      }
    }
  } else if (items.length === 0) {
    text = 'Play today to start your collection.';
  } else if (item !== undefined) {
    const on = placed.has(item.id);
    text = `Day ${item.day}, made by u/${item.maker}. ${
      on ? 'On your pet now.' : 'Not placed.'
    }`;
    action = {
      label: on ? 'Take away' : 'Place',
      go: () => void run({ type: 'toggle', itemId: item.id }),
    };
  }
  if (note !== null) text = note;

  const preview = (() => {
    if (item !== undefined) {
      return (
        <span
          className="art paper"
          style={{ width: 64, height: 64, flex: 'none' }}
        >
          <DrawingArt
            entry={item.entry}
            label={`${item.category} by u/${item.maker}`}
          />
        </span>
      );
    }
    if (pet !== undefined) {
      const px = PET_PX[pet];
      return (
        <span
          style={{
            width: 64,
            height: 64,
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={`/art/${pet}.png`}
            alt=""
            style={{ position: 'static', width: px.w * 4, height: px.h * 4 }}
          />
        </span>
      );
    }
    return null;
  })();

  return (
    <>
      <div className="px" style={{ left: 12, top: 8, width: 351 }}>
        <div className="heartbar" style={{ padding: '4px 12px' }}>
          <h1 className="t24 display" aria-live="polite">
            {tabName}
          </h1>
          {pages > 1 && (
            <span className="t16">
              Page {at + 1} of {pages}
            </span>
          )}
        </div>
      </div>
      <img
        src="/art/panel.png"
        alt=""
        style={{ left: 2, top: 62, width: 372, height: 336 }}
      />
      {TABS.map((t) => (
        <button
          key={t.id}
          className="artbtn"
          style={{ left: t.left, top: 58, width: 68, height: 44 }}
          aria-label={t.name}
          aria-pressed={tab === t.id}
          onClick={() => choose(t.id)}
        />
      ))}
      {onPets
        ? PETS.map((p: PetId, i) => {
            const px = PET_PX[p];
            const owned = pv.unlocked.includes(p);
            return (
              <button
                key={p}
                className={owned ? 'entry paper pet' : 'entry paper pet locked'}
                style={pocket(i)}
                aria-label={`${petLabel(p)}${
                  p === pv.pet ? ', your pet' : owned ? '' : ', locked'
                }`}
                aria-pressed={sel === p}
                onClick={() => select(p)}
              >
                <img
                  src={`/art/${p}.png`}
                  alt=""
                  style={{ width: px.w * 4, height: px.h * 4 }}
                />
                {p === pv.pet && (
                  <span className="badge">
                    <Icon name="check" />
                  </span>
                )}
              </button>
            );
          })
        : shown.map((it, i) => (
            <button
              key={it.id}
              className="entry paper"
              style={pocket(i)}
              aria-label={`${petLabel(it.category)} by u/${it.maker}, day ${
                it.day
              }${placed.has(it.id) ? ', on your pet' : ''}`}
              aria-pressed={sel === it.id}
              onClick={() => select(it.id)}
            >
              <DrawingArt entry={it.entry} />
              {placed.has(it.id) && (
                <span className="badge">
                  <Icon name="check" />
                </span>
              )}
            </button>
          ))}
      <div
        className="px"
        style={{
          left: 12,
          top: 404,
          width: action === null ? 351 : 235,
          height: 88,
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}
        >
          {preview}
          <p
            className="t12"
            style={{ minWidth: 0, overflowWrap: 'anywhere' }}
            aria-live="polite"
            {...(note === null ? {} : { role: 'alert' })}
          >
            {text}
          </p>
        </div>
      </div>
      {action !== null && (
        <div
          style={{
            position: 'absolute',
            left: 255,
            top: 404,
            width: 108,
            height: 88,
          }}
        >
          <button
            className="px in btn primary t16"
            style={{ width: '100%', height: '100%' }}
            onClick={action.go}
          >
            {action.label}
          </button>
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 504,
          width: 351,
          display: 'grid',
          gridTemplateColumns: pages > 1 ? '1fr 1fr 1fr' : '1fr',
          gap: 8,
        }}
      >
        {back}
        {pages > 1 && (
          <>
            <button
              className="px in btn t24"
              style={{ height: 60 }}
              disabled={at <= 0}
              onClick={() => setPage(at - 1)}
            >
              Prev
            </button>
            <button
              className="px in btn t24"
              style={{ height: 60 }}
              disabled={at >= pages - 1}
              onClick={() => setPage(at + 1)}
            >
              Next
            </button>
          </>
        )}
      </div>
    </>
  );
}
