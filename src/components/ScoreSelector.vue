<script setup>
import { ref, toRefs, watch } from 'vue'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import { MusicalScore } from '@/models/MusicalScore'
import { useSettings } from '@/composables/useSettings'

const { upsertScore, loadScore, deleteScore, newScore } = useIndexedDBStore()

const { score, scoreTitles } = toRefs(useIndexedDBStore())

const { currentScoreId, currentProjectName } = useSettings()

const deleteCurrentScore = () => {
  console.log('Delete Score:', currentScoreId.value)
  deleteScore(currentProjectName.value, currentScoreId.value)
  // score.value = MusicalScore.new()
}

const allTitles = () => {
  if (score.value == null || scoreTitles.value.includes(score.value.title)) {
    return scoreTitles.value
  } else {
    return [{ id: null, value: score.value.title }, ...scoreTitles.value]
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
        @click="deleteCurrentScore"
        >delete</p-button
      >
      <p-button
        icon="pi pi-save"
        severity="secondary"
        variant="text"
        @click="upsertScore"
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
