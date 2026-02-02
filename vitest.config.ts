import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.{test.ts,test.tsx}', 'src/**/*.test.ts'],
    setupFiles: [path.resolve(__dirname, 'test/setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}']
    }
  }
})
