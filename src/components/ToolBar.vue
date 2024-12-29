<script setup lang="ts">
import { useCursor } from '@/composables/useCursor'
import { useSound } from '@/composables/useSound'
import { computed, ref } from 'vue'

import { useDialog } from 'primevue/usedialog'
import EditScoreDialog from './EditScoreDialog.vue'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import OpenScoreDialog from './OpenScoreDialog.vue'
const { saveScore } = useIndexedDBStore()

const dialog = useDialog()

const { play, pause, isPlaying } = useSound()
const { score, voiceId } = useCursor()

const isDarkMode = ref(false)

const voiceOptions = computed(() => {
  const options = Array.from({ length: 4 }, (_, i) => ({
    label: '' + (i + 1),
    value: i,
    class: `voice-${i}`,
  }))
  return options
})

const toggleDarkMode = () => {
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
  await saveScore(score.value)
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
  dialog.open(OpenScoreDialog, {
    props: {
      header: 'Open Score',
      modal: true,
      dismissableMask: true,
    },
  })
}
</script>

<template>
  <div class="toolbar">
    <p-toolbar>
      <template #start>
        <!-- <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          width="16"
          height="16"
          class="icon-background"
          style="background-color: var(--p-toolbar-background, white)"
        >
          <polygon
            points="10,0 54,0 64,28 64,58 54,58 54,64 10,64 10,58 0,58 0,28"
            rx="5"
            class="icon-primary"
          ></polygon>
          <circle cx="22" cy="16" r="5" class="icon-secondary" />
          <circle cx="14" cy="40" r="5" class="icon-secondary" />
          <circle cx="42" cy="16" r="5" class="icon-secondary" />
          <circle cx="50" cy="40" r="5" class="icon-secondary" />

          <line x1="14" x2="20" y1="40" y2="54" class="icon-secondary" />
          <line x1="20" x2="20" y1="54" y2="64" class="icon-secondary" />

          <line x1="22" x2="28" y1="16" y2="54" class="icon-secondary" />
          <line x1="28" x2="28" y1="54" y2="64" class="icon-secondary" />

          <line x1="42" x2="36" y1="16" y2="54" class="icon-secondary" />
          <line x1="36" x2="36" y1="54" y2="64" class="icon-secondary" />

          <line x1="50" x2="44" y1="40" y2="54" class="icon-secondary" />
          <line x1="44" x2="44" y1="54" y2="64" class="icon-secondary" />
        </svg>
        <i class="pi pi-bars" @click="toggleSideBar"></i> -->
        <i :class="`pi ${isPlaying ? 'pi-pause' : 'pi-play'}`" @click="togglePlay"></i>
        <i :class="`pi ${isDarkMode ? 'pi-sun' : 'pi pi-moon'}`" @click="toggleDarkMode"></i>
      </template>

      <template #center>
        <p-inputgroup>
          <p-inputgroupaddon>
            <button class="p-button p-button-text" @click="openScore" title="Open score">
              <i class="pi pi-folder-open"></i>
            </button>
          </p-inputgroupaddon>
          <p-inputtext readonly v-model="score.title" placeholder="score" />
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
      </template>
    </p-toolbar>
  </div>
</template>
