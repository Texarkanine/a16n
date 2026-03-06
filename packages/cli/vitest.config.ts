import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
    passWithNoTests: true,
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['test/**/*', 'dist/**/*', 'node_modules/**/*', 'src/commands/io.ts'],
      reportsDirectory: './coverage',
    },
  },
});
