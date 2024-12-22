<script setup lang="ts">
import { ref, onMounted, watch, nextTick, type Ref, computed } from 'vue'
import { useCanvas } from '@/composables/useCanvas'
import { useKeys } from '@/composables/keys/useKeys'
import { useCommands } from '@/composables/useCommands'
import { useCursor } from '@/composables/useCursor'
import type { NotePosition } from '@/models/NotePosition'
import { useSound } from '@/composables/useSound'
const { play, pause, isPlaying } = useSound()

const { score, voiceId } = useCursor()
const { drawScore, canvasRef, canvasContainerRef } = useCanvas()

useCommands()
useKeys()

const isDarkMode = ref(false)
const errorPopover = ref()

const voiceOptions = computed(() => {
  const options = Array.from({ length: 4 }, (_, i) => ({
    label: '' + (i + 1),
    value: i,
    class: `voice-${i}`,
  }))
  return options
})

const toggleSideBar = () => {
  document.body.classList.toggle('sidebar-closed')
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
}

const toggleErrorPopover = event => {
  errorPopover.value.toggle(event)
}

const togglePlay = () => {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

watch(
  [score, voiceId],
  () => {
    drawScore()
  },
  { deep: true },
)
</script>

<template>
  <div class="right-column">
    <div class="toolbar">
      <p-toolbar>
        <template #start>
          <svg
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
          <i class="pi pi-bars" @click="toggleSideBar"></i>
          <i :class="`pi ${isPlaying.value ? 'pi-pause' : 'pi-play'}`" @click="togglePlay"></i>
          <i :class="`pi ${isDarkMode.value ? 'pi-sun' : 'pi pi-moon'}`" @click="toggleDarkMode"></i>

          <p-badge
            v-if="score?.errors().length > 0"
            @click="toggleErrorPopover"
            severity="danger"
            size="medium"
            :value="score?.errors().length"
          ></p-badge>
        </template>

        <template #center>
          <span>{{ score.title }}</span>
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
              <span :class="option.class">{{ option.label }}</span>
            </template>
          </p-selectbutton>
        </template>
      </p-toolbar>

      <p-popover ref="errorPopover">
        <p-datatable :value="score?.errors()" tableStyle="min-width: 50rem">
          <p-column field="track" header="Track" class="w-1/6"></p-column>
          <p-column field="bar" header="Bar" class="w-1/6"></p-column>
          <p-column field="voice" header="Voice" class="w-1/6" bodyClass="whitespace-nowrap"></p-column>
          <p-column field="error" header="Error" sortable class="w-1/6">
            <template #body="slotProps">
              Duration is {{ slotProps.data.duration }} beat (expecting {{ slotProps.data.expectedDuration }})
            </template>
          </p-column>
        </p-datatable>
      </p-popover>
    </div>
    <div ref="canvasContainerRef" id="canvas-wrapper">
      <canvas ref="canvasRef" class="theCanvas"></canvas>
    </div>
  </div>
</template>

<style>
:root {
  /* Normal mode colors */
  --border-color: #999;
  --background-color: #f0f0f0;
  --foreground-color: #333;
  --foreground-hover-color: #666;
  --error-color: red;
  --voice-0-color: #8e0000; /* Darker red */
  --voice-1-color: #4a0072; /* Darker purple */
  --voice-2-color: #0000b2; /* Darker blue */
  --voice-3-color: #004d40; /* Darker teal */
}

#canvas-wrapper {
  position: relative;
  scroll-behavior: smooth;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: pink;
  flex: 1;
}

.dark-mode {
  /* Dark mode colors */
  --border-color: #555;
  --background-color: #333;
  --foreground-color: #f0f0f0;
  --foreground-hover-color: #aaa;
  --error-color: red;
}
</style>
<style module>
.mr-2 {
  margin-right: 1rem;
}

.options-toolbar {
  flex: 1;
  padding-top: 20px;
}

.bpm {
  width: 100px;
}

line {
  stroke-width: 1;
  stroke: var(--foreground-color);
}

text {
  fill: var(--foreground-color);
  stroke: var(--foreground-color);
  text-anchor: middle;
  dominant-baseline: central;
  font-family: sans-serif;
  stroke-width: 0.5;
}

textarea {
  display: block;
  margin: 0 auto 20px auto;
  width: 100%;
  max-width: 400px;
  padding: 10px;
  font-family: monospace;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  resize: vertical;
}
</style>
<style>
g.note.rest {
  opacity: 0;
}

g.note.rest:hover {
  opacity: 0.5;
  rect {
    fill: var(--foreground-color);
  }
}

g.note.rest.current {
  opacity: 1;
}

line.note {
  stroke-width: 0.75;
  stroke: var(--foreground-color);
}

g.bar.error line.bar {
  stroke: var(--error-color);
}

g.bar.current line.bar {
  stroke-width: 2;
}

.note > rect {
  fill: var(--background-color);
  cursor: pointer;
}
.note.current > rect {
  fill: var(--foreground-color);
}

.note.current > text {
  stroke: var(--background-color);
  fill: var(--background-color);
}

.title {
  color: var(--foreground-color);
}

g.voice text {
  opacity: 0.5;
  cursor: pointer;
}

g.voice.current text {
  opacity: 1;
}

g.voice.selected text {
  opacity: 1;
}

g.instrument text {
  text-anchor: end;
}

g.instrument text.instrument-name {
  text-anchor: middle;
}

path.hammer,
path.bend,
path.vibrato {
  stroke: var(--foreground-color);
  stroke-width: 2;
}

.theCanvas {
  display: block;
  box-sizing: border-box;
}

.toolbar {
  /* position: absolute; */
  /* left: 20px;
  height: 30px;
  top: 10px; */
  /* border: solid 1px black; */
}

/* .voice-selector {
  position: absolute;
  right: 20px;
  height: 30px;
  top: 10px;
  border: solid 1px black;
} */

.p-toolbar-start {
  gap: 10px;
}
</style>
ga
