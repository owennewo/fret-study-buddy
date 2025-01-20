import { defineStore } from 'pinia'
import { openDB } from 'idb'
import { useCursor } from '@/composables/useCursor'

import { useToast } from 'primevue/usetoast';
import type { ToastMessageOptions } from 'primevue';
import { watch } from 'vue';

const DATABASE_NAME = 'ApplicationDatabase'
const SCORES_STORE = 'Scores'
const SETTINGS_STORE = 'Settings'

export const useSettingsStore = defineStore('settingsStore', () => {

  const { projectId, projectName, scoreId, tempoPercent, isDarkMode, isPlaybackLooping, projectType, clientId } = useCursor()
  const toast = useToast();

  watch([projectType, projectId, clientId, projectName, scoreId, tempoPercent, isDarkMode, isPlaybackLooping],  () => {
    saveSettingsToDB()
  })

  async function getDB() {
    const db = openDB(DATABASE_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(SCORES_STORE)) {
          db.createObjectStore(SCORES_STORE, {
            keyPath: 'id',
          });
        }
      },
    })
    return db
  }

  async function loadSettingsFromDB() {

    const db = await getDB()
    const settings = await db.get(SETTINGS_STORE, DATABASE_NAME)

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
      id: DATABASE_NAME,
      projectType: projectType.value,
      projectId: projectId.value,
      clientId: clientId.value,
      projectName: projectName.value,
      scoreId: scoreId.value,
      tempoPercent: tempoPercent.value,
      isDarkMode: isDarkMode.value,
      isPlaybackLooping: isPlaybackLooping.value,
    }
    await db.put(SETTINGS_STORE, settings)
  }

  return {
    loadSettingsFromDB,
    saveSettingsToDB,
  }
})
