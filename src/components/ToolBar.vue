<script setup lang="ts">
import { useCursor } from '@/composables/useCursor'
import { useSound } from '@/composables/useSound'
import { computed, toRaw } from 'vue'

import { useDialog } from 'primevue/usedialog'
import EditScoreDialog from './EditScoreDialog.vue'
import ScoreSelectorDialog from './ScoreSelectorDialog.vue'
import { useDataStore } from '@/composables/datastores/useDataStore'


import {useSettingsStore} from '@/stores/settingsStore'

const { saveSettingsToDB } = useSettingsStore()

const dialog = useDialog()
const datastore = useDataStore();
const { play, pause, isPlaying } = useSound()
const { score, scoreId, voiceId, tempoPercent, isDarkMode, isPlaybackLooping, projectId, project } = useCursor()

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

const toggleDarkMode = async() => {
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
  datastore.saveScore(projectId.value, score.value)
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
const nextScore = async() => {
  console.log('next score')
  const scores = await datastore.listScores(projectId.value)
  let scoreIndex = scores.findIndex(scoreLite => scoreLite.title == score.value.title) ?? -1
  scoreIndex += 1
  if (scoreIndex > scores.length -1) {
    scoreIndex = 0
  }

  // debugger
  const newScore = scores[scoreIndex]
  scoreId.value = newScore!.id
}

const prevScore = async() => {
  console.log('prev score')
  console.log('next score')
  const scores = await datastore.listScores(projectId.value)
  let scoreIndex = scores.findIndex(scoreLite => scoreLite.title == score.value.title) ?? -1
  scoreIndex -= 1
  if (scoreIndex < 0) {
    scoreIndex = scores.length -1
  }

  const newScore = scores[scoreIndex]
  scoreId.value = newScore!.id

}


const syncGDrive = async () => {

  dialog.open(ScoreSelectorDialog, {
  // dialog.open(SyncDialog, {
    props: {
      header: 'Project Sync',
      modal: true,
      dismissableMask: true,
    },
  })


  // const files = await listFiles()
  // debugger
  // if (files.length > 0) {
  //   console.log('files', files)

  //   const projectFile = await downloadFile(files[0].id);

  //   await importProject(projectFile);

  //   console.log('Project downloaded and imported successfully!');

  // } else {
  //   console.log('No files found')
  // }

}
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
          <p-inputnumber
            v-model="tempoPercent"
            inputId="tempoPercent"
            variant="filled"
            :min="10"
            :max="200"
            :step="10"
            suffix="%"
            showButtons
            readOnly
            style="width: 6rem"
          />
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
            <p-button
              class="p-button p-button-text"
              severity="primary"
              @click="prevScore"
              title="Previous score"
            >
              <i class="pi pi-angle-left"></i>
            </p-button>
          </p-inputgroupaddon>

          <p-inputgroupaddon>
            <p-button
              severity="primary"
              class="p-button p-button-text"
              @click="nextScore"
              title="Next score"
            >
              <i class="pi pi-angle-right"></i>
            </p-button>
          </p-inputgroupaddon>

          <p-inputtext readonly :value="score?.title" placeholder="score" />
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
        <p-selectbutton
          v-model="voiceId"
          :options="voiceOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
        >
          <template #option="{ option }">
            <div :class="`voice-option ${option.class}`" :title="`voice ${option.label}`">{{ option.label }}</div>
          </template>
        </p-selectbutton>
        <i :class="`pi ${isDarkMode ? 'pi-sun' : 'pi pi-moon'}`" @click="toggleDarkMode"></i>
        <p-button icon="pi pi-google" @click="syncGDrive"></p-button>

      </template>
    </p-toolbar>
  </div>
</template>
<style>
.p-toolbar-end {
  gap: 10px;
}
</style>
