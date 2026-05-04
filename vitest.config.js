import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 15000,
    coverage: {
      include: ['scripts/**/*.js', 'hooks/**/*.js'],
      all: true
    }
  }
});
