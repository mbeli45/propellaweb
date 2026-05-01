import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Upload source maps to Sentry on production builds
    process.env.NODE_ENV === 'production' && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok.io'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg'],
  },
})
