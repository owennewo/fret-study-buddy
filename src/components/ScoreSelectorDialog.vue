<script setup lang="ts">
import { ref, onMounted, type Ref, toRaw } from 'vue'

import { useLocalDataStore } from '@/composables/datastores/useLocalDataStore'
import type { Project } from '@/interfaces/DataStore'
import { useCursor } from '@/composables/useCursor'

const { score } = useCursor()


const projects: Ref<Array<Project>> = ref([])
const localDataStore = useLocalDataStore()
const nodes = ref([])

const fetchNodes = async () => {
  const treeData = await Promise.all(
    projects.value.map(async project => {
        console.log('Loading nodes for Project: ', project)
      const scores = await localDataStore.listScores(project.id)
      return {
        key: project.id,
        data: {
          name: project.name,
          size: `${scores.length} scores`,
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
  const fetchedScore = await localDataStore.getScore(row.data.project.id, row.key)
  score.value = fetchedScore

}

const refreshProjects = async () => {
  projects.value = await localDataStore.listProjects()
  await fetchNodes()
}

onMounted(async () => {
  refreshProjects()
})

const pop = ref()

const toggle = event => {
  pop.value.toggle(event)
}

const projectName = ref()

const projectType = ref()
const projectTypes = ref([
  { name: 'Local', description: 'Stored in your browser local storage' },
  { name: 'Google-Drive', description: 'Stored in your google drive' },
])

const addProject = () => {
  console.log('Project Name: ', projectName.value, 'Project Type: ', projectType.value)
  localDataStore.createProject(projectName.value)
}

const addScore = () => {
  console.log('Adding Score')
}

const deleteRow = (row) => {
  console.log('Deleting Project: ', row)
  debugger
  if (row.data.type === 'project') localDataStore.deleteProject(row.key)
  if (row.data.type === 'score') localDataStore.deleteScore(row.data.project.id, row.key)
  refreshProjects()
}

</script>

<template>
  <div class="card">
    <p-treetable :value="nodes" tableStyle="min-width: 50rem">
      <template #header>
        <div class="text-xl font-bold">Projects</div>
        <p-button icon="pi pi-plus" label="Add Project" severity="info" @click="toggle" />
      </template>
      <p-column field="name" header="Name" expander style="width: 250px"></p-column>
      <p-column field="size" header="Size" style="width: 150px"></p-column>
      <p-column field="type" header="Type" style="width: 150px"></p-column>
      <p-column style="width: 10rem">
        <template #body="slotProps">
          <p-button :v-if="slotProps.node.data.type === 'project'" icon="pi pi-plus" rounded title="Add Score" @click="addScore()" />
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
          <p-button icon="pi pi-refresh" label="Reload" severity="warn" />
        </div>
      </template>
    </p-treetable>
  </div>
  <p-popover ref="pop">
    <div class="flex flex-col gap-4">
      <div>
        <p-inputtext v-model="projectName" placeholder="Project Name" />

        <div class="card flex justify-center">
          <p-select
            v-model="projectType"
            :options="projectTypes"
            optionLabel="name"
            placeholder="Select a ProjectType"
            class="w-full md:w-56"
          />
          <p>{{ projectType?.description ?? '' }}</p>
          <p-button :disabled="!projectName || !projectType" icon="pi pi-plus" label="Add" @click="addProject" />
        </div>
      </div>
    </div>
  </p-popover>
</template>
