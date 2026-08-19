import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only the pure logic is covered today: the unit tables, the form schemas
    // and the decimal-text helpers. None of it needs a DOM, so no environment
    // is configured — adding one is a decision for whoever first tests a
    // component or a hook.
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    environment: 'node',
  },
});
