<script setup lang="ts">
import { ref, onMounted, watch, nextTick, type Ref } from 'vue'
import { useSVG } from '@/composables/useSVG'
import { useKeys } from '@/composables/keys/useKeys'
import { useCursor } from '@/composables/useCursor'
import type { NotePosition } from '@/models/NotePosition'

const { score, voiceId, note, resetCursor } = useCursor()

const { drawScore, svgRef } = useSVG()

useKeys()

onMounted(() => {
  console.log('SVG loaded:', svgRef.value)
})

watch(
  [score, voiceId],
  () => {
    nextTick(() => {
      drawScore()
    })
  },
  { deep: true },
)

watch(note, (newNote: Ref<NotePosition | null>) => {
  if (newNote) {
    resetCursor()
  }
})
</script>

<template>
  <article class="score">
    <svg ref="svgRef" xmlns="http://www.w3.org/2000/svg" class="score" viewBox="0 0 1000 600"></svg>
  </article>
</template>

<style scoped>
article.score {
  flex: 1; /* Make container take remaining space */
  display: flex;
  align-items: center;
  justify-content: center;
}

svg.score {
  width: 100%;
  height: 100%;
  border: 1px black solid;
  margin: 0 auto;
  background-color: var(--background-color);
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
