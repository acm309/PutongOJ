// https://vitejs.dev/config/
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'

const DEFAULT_HTTP_PORT = 3000
const DEFAULT_WS_PORT = 3001
const DEV_PORT = 5173
const DEV_DOCS_PORT = 5174

export default defineConfig(({ mode }) => {
  const workspaceRoot = path.resolve(import.meta.dirname, '../..')
  const env = loadEnv(mode, workspaceRoot, '')
  const httpPort = Number.parseInt(env.PTOJ_WEB_PORT, 10) || DEFAULT_HTTP_PORT
  const wsPort = Number.parseInt(env.PTOJ_WS_PORT, 10) || DEFAULT_WS_PORT

  return {
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
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
    server: {
      port: DEV_PORT,
      strictPort: true,
      proxy: {
        '/api': { target: `http://localhost:${httpPort}`, changeOrigin: true },
        '/docs': { target: `http://localhost:${DEV_DOCS_PORT}`, changeOrigin: true },
        '/uploads': { target: `http://localhost:${httpPort}`, changeOrigin: true },
        '/ws': { target: `ws://localhost:${wsPort}`, ws: true },
      },
    },
  }
})
