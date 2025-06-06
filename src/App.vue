<script setup lang="ts">
import CanvasFrame from './components/CanvasFrame.vue'
import DynamicDialog from 'primevue/dynamicdialog'
import { useCursor } from './composables/useCursor'
import { useLocalDataStore } from './composables/datastores/useLocalDataStore'
import { onMounted, watch } from 'vue'
import type { Score } from './models/Score'
import { useDataStore } from './composables/datastores/useDataStore'
import { useToast } from 'primevue'
import type { Metadata } from './models/Metadata'

const { projectId, score, scoreId } = useCursor()
const { loadSettingsFromDB } = useLocalDataStore()
const datastore = useDataStore()

const toast = useToast()

watch(scoreId, async newCurrentScoreId => {
  if (!newCurrentScoreId) {
    return
  }
  if (newCurrentScoreId != null) {
    const loadedScore = await datastore.getLocal({ id: newCurrentScoreId } as Metadata)
    if (!loadedScore) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No score found with ID: ' + newCurrentScoreId,
        life: 3000,
        group: 'restore',
      })
      console.error('No score found with ID:', newCurrentScoreId)
      return
    }
    score.value = loadedScore as Score
  }
})

onMounted(async () => {
  loadSettingsFromDB()
})

const restoreProject = async (options) => {
  console.log('Restoring Project:', options.message.data)
  projectId.value = options.message.data.projectId
  scoreId.value = options.message.data.scoreId
  toast.removeGroup('restore');
}
</script>

<template>
  <p-toast />
  <p-toast group="restore">
    <template #message="options">
      <div class="flex flex-col gap-5 w-full">
        <div class="flex align-items-center">
          <i class="pi pi-google text-2xl mr-4"></i>
          <h2 class="text-xl font-bold">Restore last score??</h2>
        </div>
        <div class="flex flex-col text-center">
          <p>Project: {{ options.message.data?.projectName }}</p>
          <p>Score: {{ options.message.data?.scoreTitle }}</p>
        </div>
        <div class="flex flex-row gap-2 justify-end">
          <p-button label="Restore" class="p-button-success p-button-sm" @click="restoreProject(options)" />
          <p-button label="Cancel" class="p-button-secondary p-button-sm" @click="() => toast.removeGroup('restore')" />
        </div>
      </div>
    </template>
  </p-toast>

  <DynamicDialog />
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
