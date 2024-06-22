import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const isLocal = mode === 'development';

  return {
    plugins: [
      vue(),
    ],
    base: '/fret-study-buddy/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '/artyom.window.min.js': fileURLToPath(new URL('./node_modules/artyom.js/build/artyom.window.min.js', import.meta.url))
      }
    },
    server: isLocal ? {
      https: {
        key: fs.readFileSync('./localhost.key'),
        cert: fs.readFileSync('./localhost.crt'),
      }
    } : {}
  }
});
