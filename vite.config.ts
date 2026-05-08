import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/frontend/setup.ts',
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  }
})
