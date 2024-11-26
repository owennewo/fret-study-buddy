<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useSVG } from '@/composables/useSVG'
import { useKeys } from '@/composables/useKeys'
import { useCursor } from '@/composables/useCursor'
import type { NotePosition } from '@/models/NotePosition'

const svgRef = ref<SVGElement | null>(null)

const { score, track, bar, voiceId, voice, element, note, resetCursor } = useCursor()

const { drawScore } = useSVG(svgRef)

useKeys(score, drawScore)

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

watch(note, (newNote: NotePosition) => {
  if (newNote) {
    resetCursor()
    //   element.value = newNote._element
    //   voice.value = newNote._element._voice
    //   if (voice.value != voiceId.value) {
    //     // voiceId.value = voice.value
    //     console.log('need to switch voice', voice.value)
    //   }

    //   bar.value = newNote._element._voice._bar
    //   track.value = newNote._element._voice._bar._track
    //   drawScore()
    // } else {
    //   console.log('################ note is null')
  }
})
</script>

<template>
  <div class="svgContainer">
    <svg ref="svgRef" xmlns="http://www.w3.org/2000/svg" class="svgFrame" viewBox="0 0 1000 1000"></svg>
  </div>
</template>

<style scoped>
.svgContainer {
  flex: 1; /* Make container take remaining space */
  display: flex;
  align-items: center;
  justify-content: center;
}

.svgFrame {
  width: 100%;
  height: 100%;
  border: 1px black solid;
}
</style>

<style>
:root {
  /* Normal mode colors */
  --background-color: beige;
  --foreground-color: #333;
  --error-color: red;
}

.dark-mode {
  /* Dark mode colors */
  --background-color: #333;
  --foreground-color: beige;
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

svg {
  margin: 0 auto;
  background-color: var(--background-color);
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
</style>
