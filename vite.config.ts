import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import { fileURLToPath, URL } from 'node:url'
// import staticFiles from './vite-plugin-static-files'

export default defineConfig({
  plugins: [
    vue(),
    // staticFiles()
  ],
  base: '/fret-study-buddy/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '/artyom.window.min.js': fileURLToPath(new URL('./node_modules/artyom.js/build/artyom.window.min.js', import.meta.url))
    }
  },
  server: {
    https: {
      key: fs.readFileSync('./localhost.key'),
      cert: fs.readFileSync('./localhost.crt'),
    }
  }
})
