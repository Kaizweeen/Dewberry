import { useEffect, useRef, useState } from 'react';
import { FULL_MAX, PETS } from '../../shared/pets';
import type { PetId } from '../../shared/pets';
import type { Item, PetAction, PetView } from '../../shared/types';
import { ApiFailure, api } from '../api';
import { DrawingArt } from '../draw/DrawingArt';
import { foodLine, pageCount, pageSlice, petLabel, unlockLine } from '../text';
import { Fullness, Icon, PET_PX } from '../ui';

const GENERIC = 'Something went wrong. Try again.';
const messageOf = (err: unknown): string =>
  err instanceof ApiFailure ? err.message : GENERIC;

export type InventoryTab = 'food' | 'clothes' | 'scenery' | 'pets';
type Tab = InventoryTab;

// The four dot groups on panel.png sit in art row 1, at columns 2 to 6, 9 to 13,
// 16 to 20 and 23 to 27 (the panel is drawn at 12 times, left 2, top 62). Each
// tab is a labelled button 80 wide, centered above its dot group.
const TABS: { id: Tab; name: string; left: number }[] = [
  { id: 'food', name: 'Food', left: 16 },
  { id: 'clothes', name: 'Clothes', left: 100 },
  { id: 'scenery', name: 'Scenery', left: 184 },
  { id: 'pets', name: 'Pets', left: 268 },
];

const pocket = (i: number) => ({
  left: 2 + (3 + 7 * (i % 4)) * 12,
  top: 62 + (4 + 7 * Math.floor(i / 4)) * 12,
  width: 48,
  height: 48,
});

// The preview slot on the plate, when it holds a pet instead of a drawing.
const SLOT = {
  width: 64,
  height: 64,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

const placedIds = (pv: PetView): ReadonlySet<string> =>
  new Set(
    [pv.placed.clothes, pv.placed.sceneryBack, pv.placed.sceneryFront].flatMap(
      (item) => (item === null ? [] : [item.id])
    )
  );

/**
 * The inventory: the waffle panel holds what the player owns, four tabs sort it.
 * Clothes and scenery are placed with the pet. Food is fed to it, one serving at a time.
 */
export function Inventory(props: { onBack: () => void; start?: Tab }) {
  const [pv, setPv] = useState<PetView | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(props.start ?? 'food');
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  // Set while the pet eats in the preview slot. The number restarts the
  // animation when the pet is fed again before it finishes.
  const [eating, setEating] = useState<number | null>(null);
  const busy = useRef(false);

  const fetchPet = () => {
    api
      .pet()
      .then(setPv)
      .catch((err: unknown) => setFailed(messageOf(err)));
  };
  const load = () => {
    setFailed(null);
    fetchPet();
  };
  useEffect(fetchPet, []);

  const run = async (action: PetAction) => {
    if (busy.current) return;
    busy.current = true;
    setNote(null);
    try {
      const result = await api.updatePet(action);
      if (result.ok) {
        setPv(result.pet);
        // Only the slime has eating frames so far. With reduced motion nothing
        // animates: the line of text and the berries already say it was fed.
        if (
          action.type === 'feed' &&
          result.pet.pet === 'slime' &&
          !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        )
          setEating((n) => (n ?? 0) + 1);
      } else setNote(result.reason);
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
  const onFood = tab === 'food';
  const full = pv.fullness >= FULL_MAX;
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
    setEating(null);
  };
  const select = (id: string) => {
    setSel(id);
    setNote(null);
    setEating(null);
  };

  // What the plate under the panel says, and the one cream button (if any).
  const item = onPets ? undefined : items.find((i) => i.id === sel);
  const pet = onPets ? PETS.find((p) => p === sel) : undefined;
  let text =
    pages > 1
      ? `Page ${at + 1} of ${pages}. Tap a drawing to see it.`
      : 'Tap a drawing to see it.';
  // Plain data, so the busy flag is only read when the button is pressed.
  let action: { label: string; act: PetAction } | null = null;
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
          act: { type: 'pick', pet },
        };
      } else if (freeSlot) {
        text = `${petLabel(pet)} is waiting for you.`;
        action = {
          label: 'Unlock',
          act: { type: 'pick', pet },
        };
      } else {
        text = unlockLine(pv.slots);
      }
    }
  } else if (items.length === 0) {
    text = onFood
      ? 'No food yet. Draw on a food day to earn some.'
      : 'Play today to start your collection.';
  } else if (onFood) {
    text = `Tap a food to feed ${pv.name}.`;
    if (item !== undefined) {
      text = foodLine(item, pv.servings[item.id] ?? 0, pv.name, full);
      if (!full)
        action = {
          label: 'Feed',
          act: { type: 'feed', itemId: item.id },
        };
    }
  } else if (item !== undefined) {
    const on = placed.has(item.id);
    text = `Day ${item.day}, made by u/${item.maker}. ${
      on ? 'On your pet now.' : 'Not placed.'
    }`;
    action = {
      label: on ? 'Take away' : 'Place',
      act: { type: 'toggle', itemId: item.id },
    };
  }
  if (note !== null) text = note;

  const preview = (() => {
    if (eating !== null) {
      // The food gives way to the pet eating it, then comes back if any is left.
      return (
        <span style={SLOT}>
          <span
            key={eating}
            className="fed"
            aria-hidden="true"
            onAnimationEnd={() => setEating(null)}
          />
        </span>
      );
    }
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
        <span style={SLOT}>
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
      <h1 className="sr-only" aria-live="polite">
        {tabName}
      </h1>
      {TABS.map((t) => (
        <div
          key={t.id}
          style={{
            position: 'absolute',
            left: t.left,
            top: 8,
            width: 80,
            height: 48,
          }}
        >
          <button
            className="px in btn t12"
            style={{ width: '100%', height: '100%' }}
            aria-pressed={tab === t.id}
            onClick={() => choose(t.id)}
          >
            {t.name}
          </button>
        </div>
      ))}
      <img
        src="/art/panel.png"
        alt=""
        style={{ left: 2, top: 62, width: 372, height: 336 }}
      />
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
              }${placed.has(it.id) ? ', on your pet' : ''}${
                onFood ? `, servings left: ${pv.servings[it.id] ?? 0}` : ''
              }`}
              aria-pressed={sel === it.id}
              onClick={() => select(it.id)}
            >
              <DrawingArt entry={it.entry} />
              {placed.has(it.id) && (
                <span className="badge">
                  <Icon name="check" />
                </span>
              )}
              {onFood && (
                <span className="servings" aria-hidden="true">
                  {pv.servings[it.id] ?? 0}
                </span>
              )}
            </button>
          ))}
      <div
        className="px"
        style={{
          left: 12,
          top: 404,
          width: action === null && !onFood ? 351 : 235,
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
      {onFood && (
        // Fullness is always in sight on the Food tab: small above the Feed button,
        // large when there is nothing to feed.
        <div
          className="px"
          style={{
            left: 255,
            top: 404,
            width: 108,
            height: action === null ? 88 : 36,
          }}
        >
          <Fullness
            full={pv.fullness}
            name={pv.name}
            size={action === null ? 28 : 21}
          />
        </div>
      )}
      {action !== null && (
        <div
          style={{
            position: 'absolute',
            left: 255,
            top: onFood ? 444 : 404,
            width: 108,
            height: onFood ? 48 : 88,
          }}
        >
          <button
            className="px in btn primary t16"
            style={{ width: '100%', height: '100%' }}
            onClick={() => void run(action.act)}
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
