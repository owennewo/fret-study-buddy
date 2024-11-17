<script setup lang="ts">
import { ref, onMounted, watch, toRefs } from 'vue'
import { useSVG } from '@/composables/useSVG'
import { useKeys } from '@/composables/useKeys'
// import { useSettings } from '@/composables/useSettings'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import { useCursor } from '@/composables/useCursor'

const svgRef = ref<SVGElement | null>(null)

// const { score } = toRefs(useIndexedDBStore())

const { score, voice } = toRefs(useCursor())

const { drawScore } = useSVG(svgRef)

watch(voice, () => {
  console.log('currentVoiceId-svg-frame', voice.value)
})

useKeys(score, drawScore)

onMounted(() => {
  console.log('SVG loaded:', svgRef.value)
})

watch(
  score,
  () => {
    // console.log('Score changed in useSVG')
    drawScore()
  },
  { deep: true },
)
</script>

<template>
  <div class="svgContainer">
    <svg
      ref="svgRef"
      xmlns="http://www.w3.org/2000/svg"
      class="svgFrame"
      viewBox="0 0 1000 1000"
    ></svg>
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
  stroke-width: 2;
  stroke: var(--foreground-color);
}

text {
  fill: var(--foreground-color);
  text-anchor: middle;
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
  opacity: 0.1;
}

line.note {
  stroke-width: 0.5;
  stroke: var(--foreground-color);
}

line.error {
  stroke: var(--error-color);
}

.note > rect {
  fill: var(--background-color);
}
.note.active > rect {
  fill: var(--foreground-color);
}

.note.active > text {
  stroke: var(--background-color);
}

.title {
  color: var(--foreground-color);
}
</style>
