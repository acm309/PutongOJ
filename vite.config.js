import { defineConfig } from 'vite';
import path from 'path';
import { createVuePlugin } from 'vite-plugin-vue2';
import envCompatible from 'vite-plugin-env-compatible';
import { injectHtml } from 'vite-plugin-html';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import { visualizer } from 'rollup-plugin-visualizer';
// import createImportPlugin from 'vite-plugin-import'
import viteCompression from 'vite-plugin-compression';
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
    createVuePlugin({ jsx: false }),
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
    viteCompression()
    // 会报错：require is not defined
    // createImportPlugin([
    //   {
    //     libraryName: 'iview',
    //     libraryDirectory: 'src/components'
    //   }
    // ]),
  ],
  // optimizeDeps: {
  //   esbuildOptions: {
  //     plugins: [
  //       esbuildCommonjs(['iview'])
  //     ]
  //   }
  // },
  build: {
    target: 'es2017',
    reportCompressedSize: false,
    // sourcemap: true,
    // https://next.router.vuejs.org/guide/advanced/lazy-loading.html#with-vite
    rollupOptions: {
      output: {
        manualChunks: {
          'common': ['vue', 'pinia', 'vue-router', 'axios'],
          'ui': ['iview']
        }
        // 不知道为啥，这两个都变成了 modulepreload，一开始就加载了
        // 预想是访问里特定网页才加载
        // manualChunks: {
        //   'statistics': [
        //     './src/views/Problem/Statistics'
        //   ],
        //   'admin': [
        //     './src/views/Problem/ProblemEdit',
        //     './src/views/Problem/Testcase',
        //     './src/views/Contest/ContestEdit',
        //     './src/views/News/NewsEdit',
        //     './src/views/Admin/ProblemCreate',
        //     './src/views/Admin/ContestCreate',
        //     './src/views/Admin/NewsCreate',
        //     './src/views/Admin/UserManage/Usermanage',
        //     './src/views/Admin/UserManage/UserEdit',
        //     './src/views/Admin/UserManage/GroupEdit',
        //     './src/views/Admin/UserManage/AdminEdit',
        //     './src/views/Admin/UserManage/TagEdit',
        //   ]
        // },
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
