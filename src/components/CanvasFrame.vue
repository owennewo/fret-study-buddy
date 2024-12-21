<script setup lang="ts">
import { ref, onMounted, watch, nextTick, type Ref } from 'vue'
import { useCanvas } from '@/composables/useCanvas'
import { useKeys } from '@/composables/keys/useKeys'
import { useCommands } from '@/composables/useCommands'
import { useCursor } from '@/composables/useCursor'
import type { NotePosition } from '@/models/NotePosition'

const { score, voiceId } = useCursor()

const { drawScore, canvasRef, canvasContainerRef } = useCanvas()

useCommands()

useKeys()

watch(
  [score, voiceId],
  () => {
    // nextTick(() => {
    drawScore()
    // })
  },
  { deep: true },
)
</script>

<template>
  <!-- <div class="canvas-parent"> -->
  <div ref="canvasContainerRef" id="canvas-wrapper" class="right-column">
    <canvas ref="canvasRef"></canvas>
  </div>
  <!-- </div> -->
</template>

<style scoped>
/* .parent {
  display: flex;
  width: 100%;
  height: 100vh;
}

article.score {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  height: 100%;
  border: 1px solid black;
}

.canvas-wrapper {
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
  overflow-y: auto;
  overflow-x: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  scroll-behavior: smooth;
}

svg.score {
  width: 100%;
  height: 100%;
  border: 1px black solid;
  margin: 0 auto;
  background-color: var(--background-color);
} */
</style>

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
  /* --voice-0-color: #c62828;
  --voice-1-color: #7b1fa2;
  --voice-2-color: #00f;
  --voice-3-color: #00796b; */
}

#canvas-wrapper {
  /* flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
  overflow-y: auto;
  overflow-x: auto;
  display: flex;
  justify-content: center;
  align-items: center; */
  scroll-behavior: smooth;
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
</style>
