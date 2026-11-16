import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Temporary screen for the first playtest. It reports the facts the real screens
// depend on, and is replaced when those screens are built.

const viewport = () => `${window.innerWidth} x ${window.innerHeight}`;

function storageWorks(): boolean {
  try {
    localStorage.setItem('probe', '1');
    const ok = localStorage.getItem('probe') === '1';
    localStorage.removeItem('probe');
    return ok;
  } catch {
    return false;
  }
}

export const Probe = () => {
  const [size, setSize] = useState(viewport);
  const [day, setDay] = useState('loading');

  useEffect(() => {
    const onResize = () => setSize(viewport());
    window.addEventListener('resize', onResize);
    fetch('/api/day')
      .then(async (res) => setDay(`${res.status} ${await res.text()}`))
      .catch((err: unknown) => setDay(`failed: ${String(err)}`));
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <main className="min-h-screen bg-white p-4 font-mono text-sm break-words text-gray-900">
      <h1 className="mb-2 text-lg font-bold">First playtest check</h1>
      <p>Expanded view size: {size}</p>
      <p>Saving drafts works: {storageWorks() ? 'yes' : 'no'}</p>
      <p>GET /api/day: {day}</p>
    </main>
  );
};

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Probe />
    </StrictMode>
  );
}
