<script setup lang="ts">
import { computed, nextTick, ref, toRefs, watch } from 'vue'
import ScoreSelector from './ScoreSelector.vue'
import ProjectSelector from './ProjectSelector.vue'
import ScoreDialog from './ScoreDialog.vue'
import { useSound } from '@/composables/useSound'
import { useCursor } from '@/composables/useCursor'

const { score, track } = toRefs(useCursor())

const currentVoiceId = ref(0)

const { play, pause, isPlaying } = useSound()

const isDarkMode = ref(false)
const showScoreDialog = ref(false)

const toggleMode = () => {
  console.log('toggleMode')
  nextTick(() => {
    console.log(isDarkMode.value)
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  })
}

const handleSave = () => {
  console.log('handleSave')
}

const voiceOptions = computed(() => {
  const options = Array.from(
    { length: track.value.voiceCount ?? 1 },
    (_, i) => ({
      key: '' + (i + 1),
      value: i + 1,
    }),
  )
  return options
})

watch(currentVoiceId, () => {
  console.log('currentVoiceId-header', currentVoiceId.value)
})
</script>
<template>
  <p-toolbar>
    <template #start>
      <div class="svg-container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          width="32"
          height="32"
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
      </div>
    </template>
    <template #center>
      <div class="toolbar-center">
        <ProjectSelector />
        <ScoreSelector />
        <p-button
          icon="pi pi-cog"
          class="settings-button"
          @click="showScoreDialog = true"
        />
        <p-button
          v-if="!isPlaying"
          icon="pi pi-play"
          class="settings-button"
          @click="play"
        />
        <p-button
          v-if="isPlaying"
          icon="pi pi-pause"
          class="settings-button"
          @click="pause"
        />
        <p-selectbutton
          v-model="currentVoiceId"
          :options="scoreOptions"
          optionLabel="key"
          optionValue="value"
        ></p-selectbutton>
      </div>
    </template>
    <template #end>
      <p-togglebutton
        @click="toggleMode"
        v-model="isDarkMode"
        onLabel="Light"
        offLabel="Dark"
      />
    </template>
  </p-toolbar>
  <ScoreDialog
    :visible="showScoreDialog"
    @update:visible="showScoreDialog = $event"
    @save="handleSave"
  />
</template>

<style scoped>
.toolbar-center {
  display: flex;
  align-items: center;
  gap: 10px; /* Adjust spacing as needed */
}

polygon.icon-primary {
  fill: #930606;
}

circle.icon-secondary {
  fill: var(--p-toolbar-background, white);
}

line.icon-secondary {
  stroke: var(--p-toolbar-background, white);
  fill: var(--p-toolbar-background, white);
  stroke-width: 4;
}
</style>
