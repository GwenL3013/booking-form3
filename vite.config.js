import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react-leaflet',
      'leaflet',
      'leaflet-routing-machine',
      '@react-leaflet/core'
    ]
  },
  server: {
    port: 5176
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs']
    }
  }
})
