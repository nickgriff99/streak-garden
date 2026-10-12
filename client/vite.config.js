import react from '@vitejs/plugin-react'
// vitest/config re-exports Vite's own defineConfig, just with the "test"
// key recognized, so this is still a normal Vite config for `vite dev`
// and `vite build`, not a separate tool.
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
