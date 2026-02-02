import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      exclude: ['src/cli.ts']
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GitHooksCLI',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['child_process'],
      output: {
        globals: {
          child_process: 'child_process'
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})
