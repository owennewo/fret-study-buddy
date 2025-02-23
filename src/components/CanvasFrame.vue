<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvas } from '@/composables/useCanvas'
import { useCommands } from '@/composables/useCommands'
import { useCursor } from '@/composables/useCursor'
import ToolBar from './ToolBar.vue'
import FretboardFrame from './FretboardFrame.vue'
import { Bar } from '@/models/Bar'
import { Note } from '@/models/Note'

const { score, scoreId, voiceId, isDarkMode } = useCursor()
const { drawScore, canvasRef, canvasContainerRef, voiceColours, selectedContainer } = useCanvas()

const errorPopover = ref()

const toggleErrorPopover = event => {
  errorPopover.value.toggle(event)
}

useCommands()

watch(
  [score, voiceId, isDarkMode],
  () => {
    if (score.value && scoreId.value && !score.value.metadata!.id) {
      console.log("skipping")
      return
    }
    drawScore()
  },
  { deep: true },
)

watch(selectedContainer, () => {
  if (selectedContainer.value) {
    const source = selectedContainer.value['source']
    if (source instanceof Bar) {
      console.log('scrolling to bar')
    } else if (source instanceof Note) {
      console.log('scrolling to Note')
    }
  }
})

</script>

<template>
  <div class="right-column">
    <ToolBar />
    <div ref="canvasContainerRef" id="canvas-wrapper">
      <p-badge v-if="score?.errors().length > 0" @click="toggleErrorPopover" severity="danger" size="medium"
        :value="score?.errors().length" class="errorBadge"></p-badge>

      <canvas ref="canvasRef" class="theCanvas"></canvas>

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
    <!-- <div>
      <FretboardFrame />
    </div> -->
  </div>

</template>

<style scoped>
button .voice-0 {
  /* background-color: yellow; */
  color: v-bind('voiceColours[0]');
}

.errorBadge {
  position: absolute;
  right: 20px;
  top: 10px;
}

button.p-togglebutton-checked .voice-0 {
  background-color: v-bind('voiceColours[0]');
  color: pink;
}

button .voice-1 {
  color: v-bind('voiceColours[1]');
}

button.p-togglebutton-checked .voice-1 {
  background-color: v-bind('voiceColours[1]');
  color: white;
}

button .voice-2 {
  color: v-bind('voiceColours[2]');
}

button.p-togglebutton-checked .voice-2 {
  background-color: v-bind('voiceColours[2]');
  color: white;
}

button .voice-3 {
  color: v-bind('voiceColours[3]');
}

button.p-togglebutton-checked .voice-3 {
  background-color: v-bind('voiceColours[3]');
  color: white;
}
</style>

<style>
:root {
  /* Normal mode colors */
  --border-color: #999;
  --background-color: #f0f0f0;
  --foreground-color: #333;
  --foreground-hover-color: #666;
  --error-color: red;
  --voice-0-color: voiceColours[0];
  --voice-1-color: voiceColours[1];
  --voice-2-color: voiceColours[2];
  --voice-3-color: voiceColours[3];
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

.note>rect {
  fill: var(--background-color);
  cursor: pointer;
}

.note.current>rect {
  fill: var(--foreground-color);
}

.note.current>text {
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

.p-toolbar-start {
  gap: 10px;
}

button.p-togglebutton {
  padding: 0px;
}

.voice-option {
  padding: 8px;
}
</style>
