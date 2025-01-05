import { defineStore } from 'pinia'
import { openDB } from 'idb'
import { useCursor } from '@/composables/useCursor'

import { useToast } from 'primevue/usetoast';

export const useSettingsStore = defineStore('settingsStore', () => {

  const { projectId, projectName, scoreId, score, tempoPercent, isDarkMode, isPlaybackLooping, projectType } = useCursor()
  const toast = useToast();

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

    const savedProjectType = settings?.projectType || 'Local'
    const savedProjectId = settings?.projectId ?? ''
    const savedProjectName = settings?.projectName ?? ''

    const savedScoreId = settings?.scoreId ?? ''
    const savedScoreTitle = settings?.scoreTitle ?? 'missing-title'


    tempoPercent.value = settings?.tempoPercent ?? 100
    isDarkMode.value = settings?.isDarkMode ?? false
    isPlaybackLooping.value = settings?.isPlaybackLooping ?? false

    if (savedProjectType == 'GDrive') {
      toast.add({ group:'restore', severity: 'info', summary: 'Info', data: {
        projectType: savedProjectType,
        projectId: savedProjectId,
        projectName: savedProjectName,
        scoreId: savedScoreId,
        scoreTitle: savedScoreTitle
      },
      // life: 10000
    });
    } else {
      projectType.value = savedProjectType
      projectId.value = savedProjectId
      projectName.value = savedProjectName
      scoreId.value = savedScoreId
    }
    db.close()

  }

  async function saveSettingsToDB() {
    const db = await getDB()
    const settings = {
      id: 'appSettings',
      projectType: projectType.value,
      projectId: projectId.value,
      projectName: projectName.value,
      scoreId: score.value?.id,
      scoreTitle: score.value?.title,
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
