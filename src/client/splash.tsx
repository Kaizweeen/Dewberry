import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Ladybug, Pet } from './ui';

// The inline view in the feed. Its size is not known, so it is fluid.
export function Splash() {
  return (
    <main
      className="stage"
      style={{
        inset: 0,
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        alignContent: 'center',
        gap: 12,
        overflow: 'hidden',
      }}
    >
      <img
        src="/art/grass.png"
        alt=""
        style={{
          left: 0,
          bottom: 0,
          width: '100%',
          height: '45%',
          objectFit: 'cover',
          objectPosition: 'top',
        }}
      />
      <Ladybug top="calc(55% + 24px)" />
      <Pet pet="star" scale={10} bob style={{ position: 'relative' }} />
      <h1 className="px in t40 display" style={{ padding: '6px 20px 10px' }}>
        <span style={{ position: 'relative' }}>Dewberry</span>
      </h1>
      <button
        className="px in btn primary t24"
        style={{ height: 56, width: 160 }}
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Play
      </button>
    </main>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Splash />
    </StrictMode>
  );
}
