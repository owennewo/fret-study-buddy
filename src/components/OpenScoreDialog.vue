<script setup lang="ts">
import { useCursor } from '@/composables/useCursor'
import { Score } from '@/models/Score'
import { useSettingsStore } from '@/stores/settingsStore'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import { ref, toRefs } from 'vue'

const { projects, scores } = toRefs(useIndexedDBStore())

const { createProject, saveScore, deleteScore } = useIndexedDBStore()

const { saveSettingsToDB } = useSettingsStore()
const { project, score, scoreId } = useCursor()

const showAddProject = ref(false)
const newProjectName = ref('')

const addProjectClicked = () => {
  console.log('Adding New Project:', newProjectName.value)
  showAddProject.value = false
  createProject(newProjectName.value)
  newProjectName.value = ''
}

const showAddProjectDialog = () => {
  showAddProject.value = true
}

const deleteScoreClicked = async () => {
  if (score.value?.id == null) {
    return
  }
  await deleteScore(score.value?.id)
  score.value = Score.new()
  scoreId.value = -1
}

const newScore = async () => {
  console.log('New Score')
  score.value = Score.new()
  const id = await saveScore(score.value)
  scoreId.value = id as number
  saveSettingsToDB()
}
</script>

<template>
  <p-floatlabel variant="on">
    <p-select
      v-model="project"
      :options="projects"
      inputId="project"
      placeholder="Select a Project"
      class="w-full md:w-56"
    >
      <template #dropdownicon>
        <i class="pi pi-book" />
      </template>
      <template #header>
        <div class="font-medium p-3">Available Projects</div>
      </template>
      <template #footer>
        <div class="p-3">
          <p-button
            label="Add New"
            @click="showAddProjectDialog"
            fluid
            severity="secondary"
            text
            size="small"
            icon="pi pi-plus"
          />
        </div>
      </template>
    </p-select>
    <label for="project">Project</label>
  </p-floatlabel>
  <p-floatlabel variant="on">
    <p-inputgroup inputId="score">
      <p-select
        v-model="scoreId"
        :options="scores"
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
        <p-button icon="pi pi-trash" severity="secondary" @click="deleteScoreClicked"></p-button>
        <!-- <p-button icon="pi pi-save" severity="secondary" @click="saveScoreClicked"></p-button> -->
      </p-inputgroupaddon>
    </p-inputgroup>
    <label for="score">Score</label>
  </p-floatlabel>

  <p-dialog v-model:visible="showAddProject" modal header="Add Project" :style="{ width: '25rem' }">
    <span class="text-surface-500 dark:text-surface-400 block mb-8">
      You will be able to add new tabs to this project.
    </span>
    <div class="flex items-center gap-4 mb-4">
      <label for="newProjectName" class="font-semibold w-24">Project Name</label>
      <p-inputtext id="newProjectName" v-model="newProjectName" class="flex-auto" autocomplete="off" />
    </div>
    <div class="flex justify-end gap-2">
      <p-button type="button" label="Cancel" severity="secondary" @click="showAddProject = false" />
      <p-button type="button" label="Save" @click="addProjectClicked" />
    </div>
  </p-dialog>
</template>
