import { useEffect, useRef, useState } from 'react';
import type { DayView, GalleryPage } from '../../shared/types';
import { ApiFailure, api } from '../api';
import { DrawingArt } from '../draw/DrawingArt';
import { Hearts, Icon, useWide } from '../ui';

// Where everything stands, on the phone and on the wide stage. The waffle panel
// is 31 x 28 art pixels, drawn at `k` screen pixels each (12 on the phone, 14
// on the wide stage), and its twelve pockets hold the drawings. On the wide
// stage the controls stand in a column to its right.
const PHONE = {
  k: 12,
  panel: { left: 2, top: 62 },
  home: { left: 12, top: 12 },
  bar: { left: 64, top: 12, width: 299 },
  text: { left: 12, top: 406, width: 351 },
  buttons: { left: 12, top: 476, width: 351 },
} as const;
const DESKTOP = {
  k: 14,
  panel: { left: 12, top: 60 },
  home: { left: 462, top: 60 },
  bar: { left: 514, top: 60, width: 274 },
  text: { left: 462, top: 116, width: 326 },
  buttons: { left: 462, top: 392, width: 326 },
} as const;

const GENERIC = 'Something went wrong. Try again.';
const messageOf = (err: unknown): string =>
  err instanceof ApiFailure ? err.message : GENERIC;

export function Gallery(props: {
  view: DayView;
  onDone: (heartsLeft: number) => void;
  onClosed: () => void;
}) {
  const L = useWide() ? DESKTOP : PHONE;
  const [entries, setEntries] = useState<GalleryPage['entries']>([]);
  const [heartsLeft, setHeartsLeft] = useState(props.view.heartsLeft);
  const [hearted, setHearted] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<'ready' | 'none' | 'seen-all'>('ready');
  const [note, setNote] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const giving = useRef(false);

  const load = (first: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setNote(null);
    api
      .gallery()
      .then((page) => {
        setHeartsLeft(page.heartsLeft);
        if (page.entries.length > 0) setEntries(page.entries);
        else setState(first ? 'none' : 'seen-all');
      })
      .catch((err: unknown) => setNote(messageOf(err)))
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
      });
  };

  useEffect(() => {
    load(true);
  }, []);

  const give = async (id: string) => {
    if (giving.current || hearted.has(id) || heartsLeft <= 0) return;
    giving.current = true;
    setNote(null);
    const mark = () => setHearted((prev) => new Set(prev).add(id));
    try {
      const result = await api.heart(id);
      if (result.ok) {
        mark();
        setHeartsLeft(result.heartsLeft);
      } else if (result.error === 'closed') {
        props.onClosed();
      } else if (result.error === 'none-left') {
        setHeartsLeft(0);
      } else if (result.error === 'already') {
        mark();
      } else {
        setNote('That drawing cannot get a heart.');
      }
    } catch (err) {
      setNote(messageOf(err));
    } finally {
      giving.current = false;
    }
  };

  let text = 'Tap a drawing you like. A heart cannot be taken back.';
  if (heartsLeft <= 0) {
    text = 'You gave all your hearts. Come back tomorrow for results.';
  }
  if (state === 'none') text = 'No other drawings yet. Check back later.';
  if (state === 'seen-all') text = 'You have seen every drawing.';
  if (loading && entries.length === 0) text = 'Loading drawings';
  if (note !== null) text = note;

  return (
    <>
      <button
        className="artbtn"
        style={{ ...L.home, width: 44, height: 44 }}
        aria-label="Home"
        onClick={() => props.onDone(heartsLeft)}
      >
        <img src="/art/home-btn.png" alt="" />
      </button>
      <div className="px" style={{ ...L.bar, height: 44 }}>
        <div className="heartbar">
          <Hearts left={heartsLeft} />
          <span className="t16">{heartsLeft} left</span>
        </div>
      </div>
      <img
        src="/art/panel.png"
        alt=""
        style={{ ...L.panel, width: 31 * L.k, height: 28 * L.k }}
      />
      {entries.map((item, i) => {
        const done = hearted.has(item.id);
        return (
          <button
            key={item.id}
            className="entry paper"
            style={{
              left: L.panel.left + (3 + 7 * (i % 4)) * L.k,
              top: L.panel.top + (4 + 7 * Math.floor(i / 4)) * L.k,
              width: 4 * L.k,
              height: 4 * L.k,
            }}
            aria-label={`Drawing ${i + 1}`}
            aria-pressed={done}
            onClick={() => void give(item.id)}
          >
            <DrawingArt entry={item.entry} />
            {done && (
              <span className="badge pop">
                <Icon name="heart" />
              </span>
            )}
          </button>
        );
      })}
      <div className="px" style={L.text}>
        <p className="t16" style={{ padding: '8px 12px' }} aria-live="polite">
          {text}
        </p>
      </div>
      <div
        style={{
          position: 'absolute',
          ...L.buttons,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        <button
          className="px in btn t24"
          style={{ height: 60 }}
          disabled={loading || state !== 'ready'}
          onClick={() => load(false)}
        >
          More
        </button>
        <button
          className="px in btn primary t32"
          style={{ height: 60 }}
          onClick={() => props.onDone(heartsLeft)}
        >
          Done
        </button>
      </div>
    </>
  );
}
