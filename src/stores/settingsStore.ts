import { defineStore } from 'pinia'
import { toRefs } from 'vue'
import { openDB } from 'idb'
import { useCursor } from '@/composables/useCursor'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'

export const useSettingsStore = defineStore('settingsStore', () => {
  const { project, score } = useCursor()

  const { loadProject, loadScore } = useIndexedDBStore()

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
      project.value = await loadProject(settings.currentProjectName || '')
      score.value = await loadScore(settings.currentScoreId || 0)
    }
  }

  async function saveSettingsToDB() {
    const db = await getDB()
    await db.put('settings', {
      id: 'appSettings',
      currentProjectName: project.value,
      currentScoreId: score.value?.id,
    })
  }

  return {
    loadSettingsFromDB,
    saveSettingsToDB,
  }
})
