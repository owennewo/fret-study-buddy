<script setup lang="ts">
import { ref, onMounted, toRaw, type Ref, inject } from 'vue'

import { useCursor } from '@/composables/useCursor'
import { useDataStore } from '@/composables/datastores/useDataStore'
import { FilterMatchMode } from '@primevue/core/api';

const { scoreId, projectType, projectId, projectName } = useCursor()

const dialogRef = inject('dialogRef') as Ref<{ close: () => void }>;

const datastore = useDataStore()
const nodes: Ref<unknown> = ref([])
const pop = ref()
const projectTypes = ref([
  { name: 'Local', description: 'Stored in your browser local storage' },
  { name: 'GDrive', description: 'Stored in your google drive' },
])

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  'country.name': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  representative: { value: null, matchMode: FilterMatchMode.IN },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  verified: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const fetchNodes = async () => {
  nodes.value = Array.from((await datastore.listScores()).values())
  console.log('Nodes: ', nodes.value)

  // nodes.value = scores.map(score => {
  //   return {
  //     title: score.title,
  //     type: 'foo',
  //     project: score.project,
  //     id: score.id,
  //     version: score.version
  //   }
  // })

}

const selectScore = async (data) => {
  console.log('Selected Score: ', toRaw(data))
  scoreId.value = data.id
  console.log('Selected Score: ', scoreId.value)
  console.log('Selected Project: ', projectId.value)
  console.log('Selected Project name: ', projectName.value)
  dialogRef.value.close()
}


onMounted(async () => {
  fetchNodes()
})

// const toggle = event => {
//   pop.value.toggle(event)
// }

// const addProject = async () => {
//   console.log('Project Name: ', projectName.value, 'Project Type: ', projectType.value)
//   await datastore.createProject(projectName.value)
//   refreshProjects()
// }


// const addRow = async (row) => {
//   if (row.data.type === 'project') {
//     console.log('Adding Score to Project: ', row.data.projectId)
//     score.value = Score.new()
//     const summary = await datastore.saveScore(score.value)
//     score.value.metadata!.id = summary.id!
//     console.log('Summary: ', summary)
//     scoreId.value = summary.id!
//     projectId.value = row.data.projectId
//     refreshProjects()
//   } else {
//     console.warn('Cannot add')
//   }
// }

const deleteScore = async (row) => {
  // console.log('Deleting Project: ', row)
  // if (row.data.type === 'project') {
  //   await datastore.deleteProject(row.data.projectId)
  // } else if (row.data.type === 'score') {
    await datastore.deleteScore(row.data.scoreId)
  // }
  fetchNodes()
}

// const handleProjectImport = async event => {
//   const file = event.target.files[0]
//   if (file) {
//     await datastore.importProject(file.name, file)
//     refreshProjects()
//     console.log('Project imported successfully.')
//   } else {
//     console.warn('No file selected.')
//   }
// }


</script>

<template>
  <div class="card">

    <p-select v-model="projectType" :options="projectTypes" optionValue="name" optionLabel="name"
      placeholder="Select a ProjectType" class="w-full md:w-56" />

    <p-datatable :value="nodes" v-model:filters="filters">
      <template #header>
        <div class="flex justify-end">
          <p-iconfield>
            <p-inputicon>
              <i class="pi pi-search" />
            </p-inputicon>
            <p-inputtext v-model="filters['global'].value" placeholder="Keyword Search" />
          </p-iconfield>
        </div>
      </template>
      <template #empty> No customers found. </template>
      <template #loading> Loading customers data. Please wait. </template>
      <p-column field="latest.title" header="Title" style="width: 250px"></p-column>
      <p-column field="latest.project" header="Project" style="width: 150px"></p-column>
      <p-column header="Local" style="width: 150px">
        <template #body="slotProps">
          <span v-if="slotProps.data.local.isLatest">{{ slotProps.data.local.version }}</span>
          <p-button v-else>overwrite</p-button>
        </template>
      </p-column>
      <p-column header="Sync" style="width: 150px">
        <template #body="slotProps">
          <p-button v-if="slotProps.data.local.isLatest && !slotProps.data.remote.isLatest" >>></p-button>
          <p-button v-if="slotProps.data.remote.isLatest && !slotProps.data.local.isLatest" ><<</p-button>
        </template>
      </p-column>

      <p-column header="Remote" style="width: 150px">
        <template #body="slotProps">
          <span>{{ slotProps.data.remote.version ?? 'missing' }}</span>
          <!-- <p-button v-else>overwrite</p-button> -->
        </template>
      </p-column>

      <p-column style="width: 10rem">
        <template #body="slotProps">
          <div class="flex flex-wrap gap-2">
            <p-button type="button" icon="pi pi-pencil" rounded severity="success"
              @click="selectScore(slotProps.data)" />
            <p-button type="button" icon="pi pi-trash" rounded severity="success" @click="deleteScore(slotProps.data)" />
          </div>
        </template>
      </p-column>
    </p-datatable>

  </div>
  <p-popover ref="pop">
    <div class="flex flex-col gap-4">
      <p-inputtext v-model="projectName" placeholder="Project Name" />

      <!-- <p-button :disabled="!projectName || !projectType" icon="pi pi-plus" label="Add" @click="addProject" /> -->

    </div>

  </p-popover>
</template>
<style></style>
