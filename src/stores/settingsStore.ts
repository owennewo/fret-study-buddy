import { defineStore } from 'pinia'
import { openDB } from 'idb'
import { useCursor } from '@/composables/useCursor'

import { useToast } from 'primevue/usetoast';
import type { ToastMessageOptions } from 'primevue';
import { watch } from 'vue';

export const useSettingsStore = defineStore('settingsStore', () => {

  const { projectId, projectName, scoreId, tempoPercent, isDarkMode, isPlaybackLooping, projectType, clientId } = useCursor()
  const toast = useToast();

  watch([projectType, projectId, clientId, projectName, scoreId, tempoPercent, isDarkMode, isPlaybackLooping],  () => {
    saveSettingsToDB()
  })

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

    clientId.value = settings?.clientId ?? crypto.randomUUID()
    tempoPercent.value = settings?.tempoPercent ?? 100
    isDarkMode.value = settings?.isDarkMode ?? false
    isPlaybackLooping.value = settings?.isPlaybackLooping ?? false
    projectType.value = savedProjectType

    if (savedProjectType == 'GDrive') {
      toast.add(
        {
          group:'restore',
          severity: 'info',
          summary: 'Info',
          data: {
            projectType: savedProjectType,
            projectId: savedProjectId,
            projectName: savedProjectName,
            scoreId: savedScoreId,
          },
          life: 10000
        } as unknown as ToastMessageOptions);
    } else {
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
      clientId: clientId.value,
      projectName: projectName.value,
      scoreId: scoreId.value,
      tempoPercent: tempoPercent.value,
      isDarkMode: isDarkMode.value,
      isPlaybackLooping: isPlaybackLooping.value,
    }
    await db.put('settings', settings)
  }

  return {
    loadSettingsFromDB,
    saveSettingsToDB,
  }
})
