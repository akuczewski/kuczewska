import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/rules/**/*.test.ts'],
    watch: false,
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
})
