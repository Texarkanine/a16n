import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
    passWithNoTests: true,
    testTimeout: 15000, // CLI tests with tsx startup need more time
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['test/**/*', 'dist/**/*', 'node_modules/**/*'],
      reportsDirectory: './coverage',
    },
  },
});
