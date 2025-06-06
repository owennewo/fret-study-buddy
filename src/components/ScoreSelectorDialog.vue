<script setup lang="ts">
import { ref, onMounted, toRaw, type Ref, inject } from 'vue'

import { useCursor } from '@/composables/useCursor'
import { useDataStore } from '@/composables/datastores/useDataStore'
import { FilterMatchMode } from '@primevue/core/api';
import { Score } from '@/models/Score';
import { useToast } from 'primevue';

const { score, scoreId, projectName, useGDrive } = useCursor()

const dialogRef = inject('dialogRef') as Ref<{ close: () => void }>;

const datastore = useDataStore()
const nodes: Ref<unknown> = ref([])
const pop = ref()
const isLoading = ref(false)
const syncingScores = ref(new Set<string>())
const toast = useToast()

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  'country.name': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  representative: { value: null, matchMode: FilterMatchMode.IN },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  verified: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const hasAttemptedRemote = ref(false)

const loadScores = async (remote: boolean = false) => {
  isLoading.value = true
  try {
    nodes.value = Array.from((await datastore.listScores(true, remote))!.values())
    if (remote) {
      hasAttemptedRemote.value = true
    }
  } finally {
    isLoading.value = false
  }
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
  loadScores(useGDrive.value)
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





const getSyncStatus = (data: Record<string, any>) => {
  if (!data.local.id && !data.remote.id) return 'none'
  if (!hasAttemptedRemote.value) return 'unknown'
  if (!data.remote.id) return 'local-only'
  if (!data.local.id) return 'remote-only'
  if (data.local.version > data.remote.version) return 'local-newer'
  if (data.local.version < data.remote.version) return 'remote-newer'
  if (data.local.clientMismatch || data.remote.clientMismatch) return 'conflict'
  return 'synced'
}

const getSyncStatusTooltip = (data: Record<string, any>) => {
  const status = getSyncStatus(data)
  const localVersion = data.local?.version ?? 'missing'
  const remoteVersion = data.remote?.version ?? 'missing'

  const baseMessage = {
    'synced': 'In sync',
    'local-newer': 'Local is newer',
    'remote-newer': 'Remote is newer',
    'conflict': 'Version conflict',
    'local-only': 'Local only',
    'remote-only': 'Remote only',
    'unknown': 'Sync status unknown',
    'none': 'No versions found'
  }[status] || 'Unknown status'

  if (hasAttemptedRemote.value) {
    return `${baseMessage}\nLocal: v${localVersion} \nRemote: v${remoteVersion}`
  } else {
    return `${baseMessage}\nLocal: v${localVersion} \nRemote: not checked`
  }
}

const getSyncStatusIcon = (status: string) => {
  switch (status) {
    case 'synced': return 'pi pi-check-circle text-green-500'
    case 'local-newer': return 'pi pi-arrow-up text-blue-500'
    case 'remote-newer': return 'pi pi-arrow-down text-orange-500'
    case 'conflict': return 'pi pi-exclamation-triangle text-red-500'
    case 'local-only': return 'pi pi-desktop text-gray-500'
    case 'remote-only': return 'pi pi-cloud text-purple-500'
    case 'unknown': return 'pi pi-question-circle text-gray-400'
    default: return 'pi pi-minus-circle text-gray-400'
  }
}

const actions = (data: Record<string, any>) => {
  console.log('items', data)

  const items = [
    {
      label: 'Push',
      icon: 'pi pi-arrow-up',
      command: async () => {
        const scoreId = data.local.id
        syncingScores.value.add(scoreId)
        try {
          const rowScore = await datastore.getLocal(data.local)
          await datastore.saveRemote(rowScore)
          console.log('Push', data)
          await loadScores(true) // Refresh with remote data
          toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Pushed "${data.latest.title}" to remote`,
            life: 3000
          })
        } catch (error) {
          console.error('Push failed:', error)
          toast.add({
            severity: 'error',
            summary: 'Push Failed',
            detail: `Failed to push "${data.latest.title}": ${error instanceof Error ? error.message : 'Unknown error'}`,
            life: 5000
          })
        } finally {
          syncingScores.value.delete(scoreId)
        }
      }
    },
    {
      label: 'Pull',
      icon: 'pi pi-arrow-down',
      command: async () => {
        const scoreId = data.local.id || data.remote.id
        syncingScores.value.add(scoreId)
        try {
          const rowScore = await datastore.getRemote(data.remote)
          await datastore.saveLocal(rowScore, true)
          await loadScores(true) // Refresh with remote data
          toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Pulled "${data.latest.title}" from remote`,
            life: 3000
          })
        } catch (error) {
          console.error('Pull failed:', error)
          toast.add({
            severity: 'error',
            summary: 'Pull Failed',
            detail: `Failed to pull "${data.latest.title}": ${error instanceof Error ? error.message : 'Unknown error'}`,
            life: 5000
          })
        } finally {
          syncingScores.value.delete(scoreId)
        }
      }
    },
    { separator: true },

    ...(data.remote?.id
      ? [
        {
          label: 'Delete Remote',
          icon: 'pi pi-trash',
          command: async () => {
            console.log('Delete Remote', data.remote.id)
            await datastore.deleteRemote(data.remote.id)
            await loadScores(true) // Refresh after deletion
          }
        }
      ]
      : []),
    ...(data.local?.id
      ? [
        {
          label: 'Delete Local',
          icon: 'pi pi-trash',
          command: async () => {
            console.log('Delete Local', data.local.id)
            await datastore.deleteLocal(data.local.id)
            await loadScores(true) // Refresh after deletion
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
    <p-datatable :value="nodes" v-model:filters="filters" :loading="isLoading">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <p-button icon="pi pi-plus" rounded raised @click="addScore" :disabled="isLoading" />
          <p-button icon="pi pi-refresh" rounded raised @click="() => loadScores(useGDrive)" :loading="isLoading" />
          <div class="flex items-center space-x-2">
            <label for="gdrive-toggle" class="text-sm font-medium">Google Drive</label>
            <p-toggleswitch 
              id="gdrive-toggle"
              v-model="useGDrive" 
              @change="() => loadScores(useGDrive)" />
          </div>
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
      <template #empty> No scores found. </template>
      <template #loading> Loading scores. Please wait. </template>
      <p-column field="latest.title" header="Title" style="width: 250px"></p-column>
      <p-column field="latest.project" header="Project" style="width: 150px"></p-column>
      <p-column header="Status" style="width: 80px">
        <template #body="slotProps">
          <div class="flex items-center justify-center">
            <i :class="getSyncStatusIcon(getSyncStatus(slotProps.data))"
              v-tooltip="getSyncStatusTooltip(slotProps.data)"></i>
            <i v-if="syncingScores.has(slotProps.data.local?.id || slotProps.data.remote?.id)"
              class="pi pi-spin pi-spinner ml-2"></i>
          </div>
        </template>
      </p-column>
      <p-column header="Actions" style="width: 150px">
        <template #body="slotProps">
          <p-splitbutton label="Select" @click="selectScore(slotProps.data)" :model="actions(slotProps.data)"
            :disabled="syncingScores.has(slotProps.data.local?.id || slotProps.data.remote?.id)" />
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
