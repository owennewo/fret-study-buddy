<script setup lang="ts">
import { ref, toRefs, watch } from 'vue'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import { useCursor } from '@/composables/useCursor'
import { Score } from '@/models/Score'
import { useSettingsStore } from '@/stores/settingsStore'

const currentScoreId = ref(-1)

const { saveScore, loadScore, deleteScore } = useIndexedDBStore()

const { scores } = toRefs(useIndexedDBStore())

const { score, resetCursor } = useCursor()
const { saveSettingsToDB } = useSettingsStore()

const newScore = async () => {
  console.log('New Score')
  score.value = Score.new()
  const id = await saveScore(score.value)
  currentScoreId.value = id as number
  saveSettingsToDB()
}

watch(score, () => {
  console.log('#######', score.value, score.value?.id, score.value?.title)
  currentScoreId.value = score.value?.id ?? -1
})

watch(currentScoreId, async newCurrentScoreId => {
  console.log('Current Score:', newCurrentScoreId)
  if (newCurrentScoreId != null) {
    const loadedScore = await loadScore(newCurrentScoreId)
    console.log('Loaded Score:', score.value)
    score.value = loadedScore as Score
    saveSettingsToDB()

    if (loadedScore) {
      resetCursor()
    }
  }
})

const deleteClicked = async () => {
  if (score.value?.id == null) {
    return
  }
  await deleteScore(score.value?.id)
  score.value = Score.new()
  currentScoreId.value = -1
}

const saveClicked = async () => {
  await saveScore(score.value)
}

const allTitles = () => {
  // debugger
  // if (score.value == null || scores.value.includes(score.value?.title)) {
  return scores.value
  // } else {
  //   return [{ id: null, value: score.value.title }, ...scores.value]
  // }
}
</script>

<template>
  <p-inputgroup>
    <p-select
      v-model="currentScoreId"
      :options="allTitles()"
      optionLabel="title"
      optionValue="id"
      placeholder="Select a score"
      class="w-full md:w-56"
    >
      <template #header>
        <div class="font-medium p-3">Available Scores</div>
      </template>
      <template #footer>
        <div class="p-3">
          <p-button label="Add New" @click="newScore" fluid severity="secondary" text size="small" icon="pi pi-plus" />
        </div>
      </template>
    </p-select>
    <p-inputgroupaddon>
      <p-button icon="pi pi-delete" severity="secondary" variant="text" @click="deleteClicked">delete</p-button>
      <p-button icon="pi pi-save" severity="secondary" variant="text" @click="saveClicked">save</p-button>
    </p-inputgroupaddon>
  </p-inputgroup>
</template>

<style scoped>
/* Style the separator */
.dropdown-separator {
  border-bottom: 1px solid #ccc;
  margin: 4px 0;
}
</style>
