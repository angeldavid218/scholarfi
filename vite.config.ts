import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Tailwind + daisyUI run via PostCSS (`postcss.config.mjs`). The Vite Tailwind plugin
// left `@tailwind utilities` / `@source` unparsed with Vite 8 + Rolldown, so no utilities shipped.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
})
