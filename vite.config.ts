import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import fs from 'fs'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const isLocal = mode === 'development'

  return {
    plugins: [vue(), vueDevTools()],
    base: '/fret-study-buddy/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: isLocal
      ? {
          https: {
            key: fs.readFileSync('./localhost.key'),
            cert: fs.readFileSync('./localhost.crt'),
          },
        }
      : {},
  }
})
