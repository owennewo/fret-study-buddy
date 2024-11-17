<script setup>
import { ref, toRefs, watch } from 'vue'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import { useCursor } from '@/composables/useCursor'
import { MusicalScore } from '@/models/MusicalScore'

const currentScoreId = ref(null)

const { saveScore, loadScore, deleteScore } = useIndexedDBStore()

const { scores } = toRefs(useIndexedDBStore())

const { score, bar, track, voice, element } = toRefs(useCursor())

const newScore = () => {
  console.log('New Score')
  score.value = MusicalScore.new()
}

watch(currentScoreId, async () => {
  console.log('Current Score:', currentScoreId.value)
  if (currentScoreId.value != null) {
    const loadedScore = await loadScore(currentScoreId.value)
    console.log('Loaded Score:', score.value)
    score.value = loadedScore

    if (loadedScore) {
      track.value = loadedScore.tracks[0]
      bar.value = track.value.bars[0]
      voice.value = bar.value.voices[0]
      element.value = voice.value.elements[0]
    }
  }
})

const allTitles = () => {
  if (score.value == null || scores.value.includes(score.value.title)) {
    return scores.value
  } else {
    return [{ id: null, value: score.value.title }, ...scores.value]
  }
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
          <p-button
            label="Add New"
            @click="newScore"
            fluid
            severity="secondary"
            text
            size="small"
            icon="pi pi-plus"
          />
        </div>
      </template>
    </p-select>
    <p-inputgroupaddon>
      <p-button
        icon="pi pi-delete"
        severity="secondary"
        variant="text"
        @click="deleteScore(score.value.id)"
        >delete</p-button
      >
      <p-button
        icon="pi pi-save"
        severity="secondary"
        variant="text"
        @click="saveScore(score.value)"
        >save</p-button
      >
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
