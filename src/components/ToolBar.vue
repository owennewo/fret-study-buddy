<script setup lang="ts">
import { useCursor } from '@/composables/useCursor'
import { useSound } from '@/composables/useSound'
import { computed, watch } from 'vue'

import { useDialog } from 'primevue/usedialog'
import EditScoreDialog from './EditScoreDialog.vue'
import ScoreSelectorDialog from './ScoreSelectorDialog.vue'
import { useDataStore } from '@/composables/datastores/useDataStore'


import { useLocalDataStore } from '@/composables/datastores/useLocalDataStore'

const { saveSettingsToDB } = useLocalDataStore()

const dialog = useDialog()
const datastore = useDataStore();
const { play, pause, isPlaying } = useSound()
const { score, scoreId, note, bar, voiceId, tempoPercent, isDarkMode, isPlaybackLooping } = useCursor()

const fretOptions = computed(() => {
  let options = Array.from({ length: 22 }, (_, i) => ({
    value: i,
    label: i.toString(),
  }))
  options = [{ value: NaN, label: 'None' }, ...options]
  return options;
})


const voiceOptions = computed(() => {
  const options = Array.from({ length: 4 }, (_, i) => ({
    label: '' + (i + 1),
    value: i,
    class: `voice-${i}`,
  }))
  return options
})

const toggleLoop = () => {
  isPlaybackLooping.value = !isPlaybackLooping.value
}

const toggleDarkMode = async () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
}

const togglePlay = () => {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

const saveScoreClicked = async () => {
  datastore.saveLocal(score.value)
  saveSettingsToDB()
}

const editScore = () => {
  console.log('edit score')
  dialog.open(EditScoreDialog, {
    props: {
      header: 'Edit Score',
      modal: true,
      dismissableMask: true,
    },
  })
}

const openScore = () => {
  console.log('open score')
  dialog.open(ScoreSelectorDialog, {
    props: {
      header: 'Open Score',
      modal: true,
      dismissableMask: true,
    },
  })
}
const nextScore = async () => {
  const scores = Array.from((await datastore.listScores())?.values() || [])
    .map(score => score.local);
  let scoreIndex = scores.findIndex(metadata => metadata!.title == score.value.metadata!.title) ?? -1
  scoreIndex += 1
  if (scoreIndex > scores.length - 1) {
    scoreIndex = 0
  }

  // debugger
  const newScore = scores[scoreIndex]
  scoreId.value = newScore!.id!
}

const prevScore = async () => {
  const scores = Array.from((await datastore.listScores())?.values() || [])
    .map(score => score.local);
  let scoreIndex = scores.findIndex(metadata => metadata!.title == score.value.metadata!.title) ?? -1
  scoreIndex -= 1
  if (scoreIndex < 0) {
    scoreIndex = scores.length - 1
  }
  const newScore = scores[scoreIndex]
  scoreId.value = newScore!.id!
}


watch(note, () => {
  console.log(note.value)
}, { deep: true })
</script>

<template>
  <div class="toolbar">
    <p-toolbar>
      <template #start>
        <p-inputgroup>
          <p-inputgroupaddon>
            <p-button :class="isPlaybackLooping ? '' : 'p-button-text'" @click="toggleLoop" title="Toggle Loop">
              <i class="pi pi-replay"></i>
            </p-button>
          </p-inputgroupaddon>
          <p-inputnumber v-model="tempoPercent" inputId="tempoPercent" variant="filled" :min="10" :max="200" :step="10"
            suffix="%" showButtons readOnly style="width: 6rem" />
          <p-inputgroupaddon>
            <p-button :class="isPlaying ? '' : 'p-button-text'" @click="togglePlay" title="Toggle Play">
              <i :class="`pi ${isPlaying ? 'pi-pause' : 'pi-play'}`"></i>
            </p-button>
          </p-inputgroupaddon>
        </p-inputgroup>
      </template>

      <template #center>
        <p-inputgroup>
          <p-inputgroupaddon>
            <button class="p-button p-button-text" @click="openScore" title="Open score">
              <i class="pi pi-folder-open"></i>
            </button>
          </p-inputgroupaddon>
          <p-inputgroupaddon>
            <p-button class="p-button p-button-text" severity="primary" @click="prevScore" title="Previous score">
              <i class="pi pi-angle-left"></i>
            </p-button>
          </p-inputgroupaddon>

          <p-inputgroupaddon>
            <p-button severity="primary" class="p-button p-button-text" @click="nextScore" title="Next score">
              <i class="pi pi-angle-right"></i>
            </p-button>
          </p-inputgroupaddon>

          <p-inputtext readonly :value="score?.metadata?.title" placeholder="score" />
          <p-inputgroupaddon>
            <p-button class="p-button p-button-text" @click="editScore" title="Edit score">
              <i class="pi pi-pencil"></i>
            </p-button>
          </p-inputgroupaddon>
          <p-inputgroupaddon>
            <p-button class="p-button p-button-text" @click="saveScoreClicked" title="Save score">
              <i class="pi pi-save"></i>
            </p-button>
          </p-inputgroupaddon>
        </p-inputgroup>
      </template>

      <template #end>
        <p-selectbutton v-model="voiceId" :options="voiceOptions" optionLabel="label" optionValue="value"
          :allowEmpty="false">
          <template #option="{ option }">
            <div :class="`voice-option ${option.class}`" :title="`voice ${option.label}`">{{ option.label }}</div>
          </template>
        </p-selectbutton>
        <i :class="`pi ${isDarkMode ? 'pi-sun' : 'pi pi-moon'}`" @click="toggleDarkMode"></i>
      </template>
    </p-toolbar>
    <p-tabs value="0">
      <p-tablist>
        <p-tab value="0">Note</p-tab>
        <p-tab value="1">Bar</p-tab>
      </p-tablist>
      <p-tabpanels>
        <p-tabpanel value="0">
          <p-selectbutton v-model="note.fretNumber" :options="fretOptions" optionLabel="label" optionValue="value"
            dataKey="label" aria-labelledby="custom">
            <template #option="{ option }">
              <div :class="`fret-option`">{{ option.label }}</div>
            </template>
          </p-selectbutton>
        </p-tabpanel>
        <p-tabpanel value="1">
          <label for="repeatStart"> repeatStart </label>
          <p-toggleswitch inputId="repeatStart" v-model="bar.repeatStart"></p-toggleswitch>
          <label for="repeatEndCount"> repeatEndCount </label>
          <p-inputnumber v-model="bar.repeatEndCount" id="repeatEndCount" variant="filled" :min="0" :max="255"
            showButtons />
          <label for="alternateCount"> alternateCount </label>
          <p-inputnumber v-model="bar.alternateCount" id="alternateCount" variant="filled" :min="0" :max="255"
            showButtons />

        </p-tabpanel>

      </p-tabpanels>
    </p-tabs>
  </div>
</template>
<style>
.p-toolbar-end {
  gap: 10px;
}
</style>
