import { ref, watch, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settingsStore'

export function useSettings() {
  const settingsStore = useSettingsStore()
  const currentVoice: Ref<number> = ref(0)
  const { currentProjectName, currentScoreId, barsPerLine } =
    storeToRefs(settingsStore)

  // Load settings from IndexedDB on initialization
  async function loadSettings() {
    await settingsStore.loadSettingsFromDB()
  }

  // Save any changes back to IndexedDB
  watch(
    [currentProjectName, currentScoreId, barsPerLine],
    () => {
      settingsStore.saveSettingsToDB()
    },
    { deep: true },
  )

  loadSettings()

  return {
    currentVoice,
    currentProjectName,
    currentScoreId,
    barsPerLine,
  }
}
