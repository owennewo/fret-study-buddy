<script setup lang="ts">
import CanvasFrame from './components/CanvasFrame.vue'
import DynamicDialog from 'primevue/dynamicdialog'
import { useCursor } from './composables/useCursor'
import { useIndexedDBStore } from './stores/useIndexedDBStore'
import { useSettingsStore } from './stores/settingsStore'
import { onMounted, watch } from 'vue'
import type { Score } from './models/Score'

const { project, score, scoreId } = useCursor()
const { loadProjects, loadProject, loadScore } = useIndexedDBStore()
const { saveSettingsToDB, loadSettingsFromDB } = useSettingsStore()

watch(project, async () => {
  if (project.value) {
    console.log('switching project:', project.value)
    loadProject(project.value)
    saveSettingsToDB()
  }
})

watch(scoreId, async newCurrentScoreId => {
  if (project.value == null || newCurrentScoreId == undefined || newCurrentScoreId <= 0) {
    return
  }
  console.log('Current Score:', newCurrentScoreId)
  if (newCurrentScoreId != null) {
    const loadedScore = await loadScore(project.value, newCurrentScoreId)
    console.log('Loaded Score:', score.value)
    score.value = loadedScore as Score
    saveSettingsToDB()
  }
})

onMounted(async () => {
  await loadProjects()
  await loadSettingsFromDB()
})
</script>

<template>
  <p-toast />
  <DynamicDialog />
  <!-- <SidePanel></SidePanel> -->
  <CanvasFrame></CanvasFrame>
</template>

<style scoped>
.wrapper {
  margin: 5px;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  display: flex;
  flex-direction: row;
}
</style>
