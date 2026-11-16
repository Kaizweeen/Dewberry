import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

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
      <img
        src="/art/star.png"
        alt=""
        style={{ position: 'relative', width: 96, height: 96 }}
      />
      <h1 className="t40 display" style={{ position: 'relative' }}>
        Dewberry
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
