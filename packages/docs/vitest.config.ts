import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['scripts/**/*.ts'],
      exclude: ['test/**/*', 'build/**/*', '.docusaurus/**/*', '.generated/**/*', 'node_modules/**/*'],
      reportsDirectory: './coverage',
    },
  },
});
