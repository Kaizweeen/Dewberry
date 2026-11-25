import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { FULL_MAX, PETS } from '../../shared/pets';
import type { PetId } from '../../shared/pets';
import type { Item, PetAction, PetView } from '../../shared/types';
import { ApiFailure, api } from '../api';
import {
  foodLine,
  itemByLine,
  itemLabel,
  pageCount,
  pageSlice,
  petLabel,
  unlockLine,
} from '../text';
import { Fullness, Icon, ItemArt, PET_PX, Pet } from '../ui';

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

// How far from the pet, in screen pixels, a dropped food still counts as fed,
// and how far the pointer must travel before a press is a drag.
const DROP_SLACK = 16;
const DRAG_FROM = 8;

const pocket = (i: number) => ({
  left: 2 + (3 + 7 * (i % 4)) * 12,
  top: 62 + (4 + 7 * Math.floor(i / 4)) * 12,
  width: 48,
  height: 48,
});

// The pet's drop zone on the Food tab's plate: as tall as the plate's inside.
const DROP_BOX = { width: 72, height: 72, flex: 'none' } as const;

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
  // A food being dragged to the pet. `from` is where the press began, and
  // `moved` turns true once the pointer has gone far enough to be a drag and
  // not a tap. `ghost` is the food's picture following the pointer, and `over`
  // is whether it is close enough to the pet to be fed.
  const press = useRef<{
    id: string;
    x: number;
    y: number;
    moved: boolean;
    size: number;
  } | null>(null);
  const [ghost, setGhost] = useState<{
    item: Item;
    x: number;
    y: number;
    size: number;
  } | null>(null);
  const [over, setOver] = useState(false);
  const zone = useRef<HTMLSpanElement>(null);
  // Set when a drag ends, so the click that follows it is not taken for a tap.
  const dragged = useRef(false);

  /** Whether a point is on the pet's drop zone, with a little room around it. */
  const onPet = (x: number, y: number) => {
    const r = zone.current?.getBoundingClientRect();
    return (
      r !== undefined &&
      x >= r.left - DROP_SLACK &&
      x <= r.right + DROP_SLACK &&
      y >= r.top - DROP_SLACK &&
      y <= r.bottom + DROP_SLACK
    );
  };

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
        // With reduced motion nothing animates: the line of text and the
        // berries already say it was fed.
        if (
          action.type === 'feed' &&
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
      ? `Page ${at + 1} of ${pages}. Tap an item to see it.`
      : 'Tap an item to see it.';
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
    text = `Drag a food to ${pv.name}.`;
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
    text = `${itemByLine(item)} ${on ? 'On your pet now.' : 'Not placed.'}`;
    action = {
      label: on ? 'Take away' : 'Place',
      act: { type: 'toggle', itemId: item.id },
    };
  }
  if (note !== null) text = note;

  // The pointer handlers of a food pocket. A press that travels is a drag: the
  // food follows the pointer and the pet opens its mouth when it gets close. A
  // press that stays put is a tap, which only selects the food (see onClick).
  const dragOf = (it: Item) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Some webviews refuse. The drag still follows the pointer over the page.
      }
      press.current = {
        id: it.id,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        size: e.currentTarget.getBoundingClientRect().width * 1.15,
      };
    },
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
      const p = press.current;
      if (p === null || p.id !== it.id) return;
      if (!p.moved) {
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_FROM) return;
        p.moved = true;
        select(it.id);
      }
      setGhost({ item: it, x: e.clientX, y: e.clientY, size: p.size });
      setOver(!full && onPet(e.clientX, e.clientY));
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      const p = press.current;
      press.current = null;
      if (p === null || !p.moved) return;
      dragged.current = true;
      setGhost(null);
      setOver(false);
      if (!onPet(e.clientX, e.clientY)) return;
      if (full) setNote(foodLine(it, pv.servings[it.id] ?? 0, pv.name, true));
      else void run({ type: 'feed', itemId: it.id });
    },
    onPointerCancel: () => {
      press.current = null;
      setGhost(null);
      setOver(false);
    },
    onDragStart: (e: { preventDefault: () => void }) => e.preventDefault(),
  });

  const preview = (() => {
    if (onFood && pv.pet !== null) {
      // On the Food tab the pet waits here for its food: it holds its mouth
      // open while a food is over it, and eats when the food is dropped.
      const size = PET_PX[pv.pet];
      const mood =
        eating !== null
          ? 'eating'
          : over
            ? 'open'
            : full
              ? 'idle'
              : pv.fullness <= 0
                ? 'asleep'
                : 'idle';
      return (
        <span ref={zone} className={over ? 'drop on' : 'drop'} style={DROP_BOX}>
          <Pet
            key={eating ?? 0}
            pet={pv.pet}
            scale={Math.floor(72 / Math.max(size.w, size.h))}
            mood={mood}
            {...(eating === null
              ? {}
              : { onAnimationEnd: () => setEating(null) })}
          />
        </span>
      );
    }
    if (eating !== null && pv.pet !== null) {
      // The food gives way to the pet eating it, then comes back if any is left.
      return (
        <span style={SLOT}>
          <Pet
            key={eating}
            pet={pv.pet}
            scale={6}
            mood="eating"
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
          <ItemArt item={item} label={itemLabel(item)} />
        </span>
      );
    }
    if (pet !== undefined) {
      return (
        <span style={SLOT}>
          <Pet pet={pet} scale={4} />
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
                <Pet pet={p} scale={4} mood="still" />
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
              style={onFood ? { ...pocket(i), touchAction: 'none' } : pocket(i)}
              {...(onFood ? dragOf(it) : {})}
              aria-label={`${itemLabel(it)}${
                it.name === undefined ? `, day ${it.day}` : ''
              }${placed.has(it.id) ? ', on your pet' : ''}${
                onFood ? `, servings left: ${pv.servings[it.id] ?? 0}` : ''
              }`}
              aria-pressed={sel === it.id}
              onClick={() => {
                if (dragged.current) dragged.current = false;
                else select(it.id);
              }}
            >
              <ItemArt item={it} />
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
      {ghost !== null &&
        // The food in the player's hand. It is outside the stage, which is scaled,
        // so it is placed in screen pixels and ignores the pointer.
        createPortal(
          <div
            aria-hidden="true"
            className={ghost.item.art === undefined ? 'art paper' : 'art'}
            style={{
              position: 'fixed',
              left: ghost.x - ghost.size / 2,
              // Held above the pointer, so the pet's open mouth stays in view.
              top: ghost.y - ghost.size * 0.95,
              width: ghost.size,
              height: ghost.size,
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            <ItemArt item={ghost.item} />
          </div>,
          document.body
        )}
    </>
  );
}
