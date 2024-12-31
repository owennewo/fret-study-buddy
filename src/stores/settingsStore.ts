import { defineStore } from 'pinia'
import { openDB } from 'idb'
import { useCursor } from '@/composables/useCursor'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
// import type { Score } from '@/models/Score'

export const useSettingsStore = defineStore('settingsStore', () => {
  const { project, scoreId, score, tempoPercent, isDarkMode, isPlaybackLooping } = useCursor()

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

    scoreId.value = settings?.currentScoreId || 0
    project.value = settings?.currentProjectName || ''
    tempoPercent.value = settings?.tempoPercent || 100
    isDarkMode.value = settings?.isDarkMode || false
    isPlaybackLooping.value = settings?.isPlaybackLooping || false
    // if (settings) {
    //   project.value = (await loadProject(settings.currentProjectName || '')) as string
    //   score.value = (await loadScore(settings.currentScoreId || 0)) as Score
    //   debugger
    // }
  }

  async function saveSettingsToDB() {
    const db = await getDB()
    const settings = {
      id: 'appSettings',
      currentProjectName: project.value,
      currentScoreId: score.value?.id,
      tempoPercent: tempoPercent.value,
      isDarkMode: isDarkMode.value,
      isPlaybackLooping: isPlaybackLooping.value,
    }
    console.log('saving settings', settings)

    await db.put('settings', settings)
  }

  return {
    loadSettingsFromDB,
    saveSettingsToDB,
  }
})
