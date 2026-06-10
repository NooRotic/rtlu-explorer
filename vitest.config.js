import { defineConfig } from 'vitest/config';

// Pure-logic tests only (selectors, encode, budget, theme contract). No DOM/three here;
// the render layer is verified by build + live boot, not unit tests.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    passWithNoTests: true,
  },
});
