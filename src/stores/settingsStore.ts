import { defineStore } from 'pinia'
import { ref, toRefs, type Ref } from 'vue'
import { openDB } from 'idb' // Using idb library for IndexedDB

import { useCursor } from '@/composables/useCursor'

export const useSettingsStore = defineStore('settingsStore', () => {
  // const currentProjectName = ref('')
  // const currentScoreId = ref(0)
  // const barsPerLine = ref(4) // Default value

  const { project, score } = toRefs(useCursor())

  // Open or create IndexedDB for settings
  async function getDB() {
    const db = openDB('appDatabase', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' })
        }
      },
    })
    return db
  }

  async function loadSettingsFromDB() {
    const db = await getDB()
    const settings = await db.get('settings', 'appSettings')
    if (settings) {
      project.value = loadProject(settings.currentProjectName || '')
      score.value = loadScore(settings.currentScoreId || 0)
      // barsPerLine.value = settings.barsPerLine || 4
    }
  }

  async function saveSettingsToDB() {
    const db = await getDB()
    await db.put('settings', {
      id: 'appSettings',
      currentProjectName: project.value,
      currentScoreId: score.value?.id,
      // barsPerLine: barsPerLine.value,
    })
  }

  return {
    // currentProjectName,
    // currentScoreId,
    // barsPerLine,
    loadSettingsFromDB,
    saveSettingsToDB,
  }
})
