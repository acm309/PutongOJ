import { defineConfig } from 'vite'
import path from 'path'
import envCompatible from 'vite-plugin-env-compatible'
import { injectHtml } from 'vite-plugin-html'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import { visualizer } from 'rollup-plugin-visualizer'
import vue from '@vitejs/plugin-vue'
import createImportPlugin from 'vite-plugin-import'
import viteCompression from 'vite-plugin-compression'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^~/,
        replacement: ''
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      }
    ],
    extensions: [
      '.mjs',
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.json',
      '.vue'
    ]
  },
  plugins: [
    vue({
      reactivityTransform: true
    }),
    viteCommonjs(),
    // support browsers which don't support esm
    legacy(),
    envCompatible(),
    injectHtml(),
    visualizer({
      // generate stats.html in project root
      // sourcemap: true,
      // brotliSize: true,
      gzipSize: true
    }),
    viteCompression(),
    createImportPlugin([
      {
        libraryName: 'view-ui-plus',
        libraryDirectory: 'src/components'
      },
    ]),
  ],
  build: {
    target: 'es2017',
    reportCompressedSize: false,
    // sourcemap: true,
    // https://next.router.vuejs.org/guide/advanced/lazy-loading.html#with-vite
    rollupOptions: {
      output: {
        manualChunks: {
          'common': ['vue', 'pinia', 'vue-router', 'axios'],
          // 'ui': ['view-ui-plus']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true
      }
    }
  }
})
