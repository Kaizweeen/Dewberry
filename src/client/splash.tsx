import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Temporary inline view for the first playtest. It reports the size of the post
// in the feed, and is replaced when the real screens are built.

const viewport = () => `${window.innerWidth} x ${window.innerHeight}`;

export const Splash = () => {
  const [size, setSize] = useState(viewport);

  useEffect(() => {
    const onResize = () => setSize(viewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white font-mono text-sm text-gray-900">
      <p>Inline view size: {size}</p>
      <button
        className="cursor-pointer rounded bg-gray-900 px-4 py-2 text-white"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Open the check screen
      </button>
    </main>
  );
};

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Splash />
    </StrictMode>
  );
}
