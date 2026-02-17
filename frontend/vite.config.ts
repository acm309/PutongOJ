// https://vitejs.dev/config/
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@backend': path.resolve(__dirname, '../backend/src'),
    },
    extensions: [ '.mjs', '.js', '.ts', '.json', '.vue' ],
  },
  plugins: [
    tailwindcss(),
    legacy(),
    visualizer({ gzipSize: true }),
    vue(),
  ],
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 1024,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          common: [ 'vue', 'pinia', 'vue-router', 'axios' ],
          interface: [ 'primevue' ],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8008', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8008', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8009', ws: true },
    },
  },
})
