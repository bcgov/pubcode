import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  define: {
    // Define window.config for build time - will be overridden by Caddy in production
    'window.config': JSON.stringify({
      VITE_SCHEMA_BRANCH: 'main',
      VITE_POWERBI_URL: ''
    })
  }
})
