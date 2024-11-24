<script setup lang="ts">
import { onMounted, ref, toRefs, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import { useCursor } from '@/composables/useCursor'
import { useSettingsStore } from '@/stores/settingsStore'

const { createProject, loadProjects, loadProject } = useIndexedDBStore()
const { projects } = toRefs(useIndexedDBStore())
const { project } = useCursor()
const showAddProject = ref(false)
const newProjectName = ref('')

const { saveSettingsToDB, loadSettingsFromDB } = useSettingsStore()

watch(project, async () => {
  if (project.value) {
    console.log('switching project:', project.value)
    loadProject(project.value)
    saveSettingsToDB()
  }
})

const addProjectClicked = () => {
  console.log('Adding New Project:', newProjectName.value)
  showAddProject.value = false
  createProject(newProjectName.value)
  newProjectName.value = ''
}

const showAddProjectDialog = () => {
  showAddProject.value = true
}

onMounted(async () => {
  await loadProjects()
  await loadSettingsFromDB()
})
</script>

<template>
  <Select v-model="project" :options="projects" placeholder="Select a Project" class="w-full md:w-56">
    <template #dropdownicon>
      <i class="pi pi-book" />
    </template>
    <template #header>
      <div class="font-medium p-3">Available Projects</div>
    </template>
    <template #footer>
      <div class="p-3">
        <Button
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
  </Select>

  <Dialog v-model:visible="showAddProject" modal header="Add Project" :style="{ width: '25rem' }">
    <span class="text-surface-500 dark:text-surface-400 block mb-8">
      You will be able to add new tabs to this project.
    </span>
    <div class="flex items-center gap-4 mb-4">
      <label for="newProjectName" class="font-semibold w-24">Project Name</label>
      <InputText id="newProjectName" v-model="newProjectName" class="flex-auto" autocomplete="off" />
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" label="Cancel" severity="secondary" @click="showAddProject = false" />
      <Button type="button" label="Save" @click="addProjectClicked" />
    </div>
  </Dialog>
</template>
