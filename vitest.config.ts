import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    exclude: ['src/rules/**', 'node_modules/**'],
    watch: false,
  },
})
