<script setup lang="ts">
import { ref, onMounted, toRaw } from 'vue'

import { useCursor } from '@/composables/useCursor'
import { useSettingsStore } from '@/stores/settingsStore'
import { useDataStore } from '@/composables/datastores/useDataStore'
import { Score } from '@/models/Score'

const { score, scoreId, projectType, projectId, projectName } = useCursor()
const { saveSettingsToDB } = useSettingsStore()

const datastore = useDataStore()
const nodes = ref([])
const pop = ref()
const projectTypes = ref([
  { name: 'Local', description: 'Stored in your browser local storage' },
  { name: 'GDrive', description: 'Stored in your google drive' },
])

const fetchNodes = async (projects) => {
  const treeData = await Promise.all(
    projects.map(async project => {
        console.log('Loading nodes for Project: ', project)
      const scores = await datastore.listScores(project.id)
      return {
        key: project.id,
        data: {
          name: project.name,
          type: 'project',
          source: 'local',
        },
        children: scores.map(score => {
          return {
            key: score.id,
            data: {
                project: project,
                name: score.title,
              // size: '25kb',
              type: 'score',
            },
          }
        }),
      }
    }),
  )

  console.log('Tree Data: ', treeData)
  nodes.value = treeData
}

const selectScore = async (row) => {
  console.log('Selected Score: ', toRaw(row))
  projectId.value = row.data.project.id
  projectName.value = row.data.project.name

  scoreId.value = row.key
  console.log('Selected Score: ', scoreId.value)
  console.log('Selected Project: ', projectId.value)
  console.log('Selected Project name: ', projectName.value)
  saveSettingsToDB()
}

const refreshProjects = async () => {
  const projects = await datastore.listProjects()
  await fetchNodes(projects)
}

onMounted(async () => {
  refreshProjects()
})

const toggle = event => {
  pop.value.toggle(event)
}

const addProject = async () => {
  console.log('Project Name: ', projectName.value, 'Project Type: ', projectType.value)
  await datastore.createProject(projectName.value)
  refreshProjects()
}


const addRow = async (row) => {
  if (row.data.type === 'project')
  {
    console.log('Adding Score to Project: ', row.key)
    score.value = Score.new()
    const summary = await datastore.saveScore(row.key, score.value)
    console.log('Summary: ', summary)
    scoreId.value = summary.id
    saveSettingsToDB()

  } else {
    console.warn('Cannot add')
  }
}

const deleteRow = async(row) => {
  console.log('Deleting Project: ', row)
  if (row.data.type === 'project')
  {
    await datastore.deleteProject(row.key)
  } else if (row.data.type === 'score') {
    await datastore.deleteScore(row.data.project.id, row.key)
  }
  refreshProjects()
}

const handleProjectImport = async event => {
  const file = event.target.files[0]
  if (file) {
    // await importProject(file)
    await datastore.importProject(file.name, file)
    refreshProjects()

    console.log('Project imported successfully.')
  } else {
    console.warn('No file selected.')
  }
}


</script>

<template>
  <div class="card">

    <p-select
      v-model="projectType"
      :options="projectTypes"
      optionValue="name"
      optionLabel="name"
      placeholder="Select a ProjectType"
      class="w-full md:w-56"
    />
    <p>{{ projectType?.description ?? '' }}</p>

    <p-treetable :value="nodes" tableStyle="min-width: 50rem">
      <template #header>
        <div class="text-xl font-bold">Projects</div>
        <p-button icon="pi pi-plus" label="Add Project" severity="info" @click="toggle" />
        <p-button icon="pi pi-plus" label="Import Project" severity="info" @click="toggle" />
        <input type="file" ref="fileInput" accept=".zip" style="display: none" @change="handleProjectImport" />

      </template>
      <p-column field="name" header="Name" expander style="width: 250px"></p-column>
      <p-column field="size" header="Size" style="width: 150px"></p-column>
      <p-column field="type" header="Type" style="width: 150px"></p-column>
      <p-column style="width: 10rem">
        <template #body="slotProps">
          <p-button :v-if="slotProps.node.data.type === 'project'" icon="pi pi-plus" rounded title="Add Score" @click="addRow(slotProps.node)" />
          <div class="flex flex-wrap gap-2">
            <p-button
              type="button"
              icon="pi pi-pencil"
              rounded
              severity="success"
              @click="selectScore(slotProps.node)"
            />
            <p-button
              type="button"
              icon="pi pi-trash"
              rounded
              severity="success"
              @click="deleteRow(slotProps.node)"
            />
          </div>
        </template>
      </p-column>

      <template #footer>
        <div class="flex justify-start">
          <p-button icon="pi pi-refresh" label="Reload" severity="warn" @click="refreshProjects()" />
        </div>
      </template>
    </p-treetable>
  </div>
  <p-popover ref="pop">
    <div class="flex flex-col gap-4">
        <p-inputtext v-model="projectName" placeholder="Project Name" />

          <p-button :disabled="!projectName || !projectType" icon="pi pi-plus" label="Add" @click="addProject" />

      </div>

  </p-popover>
</template>
<style>

</style>
