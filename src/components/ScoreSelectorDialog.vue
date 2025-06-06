<script setup lang="ts">
import { ref, onMounted, toRaw, type Ref, inject } from 'vue'

import { useCursor } from '@/composables/useCursor'
import { useDataStore } from '@/composables/datastores/useDataStore'
import { FilterMatchMode } from '@primevue/core/api';
import { Score } from '@/models/Score';

const { score, scoreId, projectName } = useCursor()

const dialogRef = inject('dialogRef') as Ref<{ close: () => void }>;

const datastore = useDataStore()
const nodes: Ref<unknown> = ref([])
const pop = ref()

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  'country.name': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  representative: { value: null, matchMode: FilterMatchMode.IN },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  verified: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const loadScores = async (remote: boolean = false) => {
  nodes.value = Array.from((await datastore.listScores(true, remote))!.values())
}

const selectScore = async (data) => {
  console.log('Selected Score: ', toRaw(data.local))
  scoreId.value = data.local.id
  console.log('Selected Score: ', scoreId.value)
  // console.log('Selected Project: ', projectId.value)
  // console.log('Selected Project name: ', projectName.value)
  dialogRef.value.close()
}

onMounted(async () => {
  loadScores()
})

const addScore = async (row) => {
  // console.log('Adding Score to Project: ', row.data.projectId)
  score.value = Score.new()
  const summary = await datastore.saveLocal(score.value)
  score.value.metadata!.id = summary.id!
  console.log('Summary: ', summary)
  scoreId.value = summary.id!
  // projectId.value = row.data.projectId
  loadScores()
}



const sync = () => {
  console.log("sync")
  // debugger
  loadScores(true)
}


const actions = (data) => {
  console.log('items', data)

  const items = [
    {
      label: 'Push',
      command: async () => {
        const rowScore = await datastore.getLocal(data.local)
        datastore.saveRemote(rowScore)
        console.log('Push', data)
      }
    },
    {
      label: 'Pull',
      command: async () => {
        const rowScore = await datastore.getRemote(data.remote)
        datastore.saveLocal(rowScore, true)
      }
    },
    { separator: true },

    ...(data.remote?.id
      ? [
        {
          label: 'Delete Remote',
          command: async () => {
            console.log('Delete Remote', data.remote.id)
            await datastore.deleteRemote(data.remote.id)
          }
        }
      ]
      : []),
    ...(data.local?.id
      ? [
        {
          label: 'Delete Local',
          command: async () => {
            console.log('Delete Local', data.local.id)
            debugger
            await datastore.deleteLocal(data.local.id)
            loadScores()
          }
        }
      ]
      : []),
  ];
  return items
}



</script>

<template>
  <div class="card">
    <p-datatable :value="nodes" v-model:filters="filters">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <p-button icon="pi pi-plus" rounded raised @click="addScore" />
          <p-button icon="pi pi-refresh" rounded raised @click="loadScores" />
          <p-button icon="pi pi-google" rounded raised @click="sync()" />
        </div>

        <div>
          <p-iconfield>
            <p-inputicon>
              <i class="pi pi-search" />
            </p-inputicon>
            <p-inputtext v-model="filters['global'].value" placeholder="Keyword Search" />
          </p-iconfield>
        </div>
      </div>
      <template #empty> No customers found. </template>
      <template #loading> Loading customers data. Please wait. </template>
      <p-column field="latest.title" header="Title" style="width: 250px"></p-column>
      <p-column field="latest.project" header="Project" style="width: 150px"></p-column>
      <p-column header="Local" style="width: 150px">
        <template #body="slotProps">
          <span>{{ slotProps.data.local.version ?? 'missing' }}</span>
        </template>
      </p-column>
      <p-column header="Sync" style="width: 150px">
        <template #body="slotProps">
          <p-splitbutton label="Select" @click="selectScore(slotProps.data)" :model="actions(slotProps.data)" />
        </template>
      </p-column>

      <p-column header="Remote" style="width: 150px">
        <template #body="slotProps">
          <span>{{ slotProps.data.remote.version ?? 'missing' }}</span>
          <!-- <p-button v-else>overwrite</p-button> -->
        </template>
      </p-column>

      <!-- <p-column style="width: 10rem">
        <template #body="slotProps">
          <div class="flex flex-wrap gap-2">
            <p-button type="button" icon="pi pi-pencil" rounded severity="success"
              @click="selectScore(slotProps.data)" />
            <p-button type="button" icon="pi pi-trash" rounded severity="success"
              @click="deleteScore(slotProps.data)" />
          </div>
        </template>
      </p-column> -->
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
