import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts on purpose: unit tests cover pure logic and must not
// load the Devvit, React, or Tailwind build plugins.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
