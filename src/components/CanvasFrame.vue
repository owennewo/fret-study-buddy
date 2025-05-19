<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

import { useCanvas } from '@/composables/useCanvas'
import { useCommands } from '@/composables/useCommands'
import { useCursor } from '@/composables/useCursor'
import ToolBar from './ToolBar.vue'
import FretboardFrame from './FretboardFrame.vue'
import { Bar } from '@/models/Bar'
import { Note } from '@/models/Note'

const { score, playbackMarker, barHeight } = useCursor()
const { canvasRef, canvasContainerRef, voiceColours, clickEvent } = useCanvas()

const errorPopover = ref()
const barPopover = ref()

const playCursorStyle = computed(() => {
  const marker = playbackMarker.value ?? 0;
  const row = Math.floor(marker / 16);
  const col = marker % 16;
  return {
    position: 'absolute',
    top: `${40 + row * barHeight.value}px`,
    left: `${(2 + col) * 40}px`,
    width: '2px',
    height: `${barHeight.value}px`,
    background: 'red',
    zIndex: 20,
    pointerEvents: 'none',
  } as any; // Suppress TS error
})
const toggleErrorPopover = event => {
  errorPopover.value.toggle(event)
}


useCommands()

const toggleFullscreen = () => {
  const el = document.getElementById('canvas-wrapper');
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  const wrapper = document.getElementById('canvas-wrapper')
  if (wrapper) {
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        // Dispatch an event that useCanvas listens for
        window.dispatchEvent(new Event('canvas-resize'))
      }
    })
    resizeObserver.observe(wrapper)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// ...existing code...
watch(clickEvent, () => {
  console.log('clickEvent')
  if (clickEvent.value) {
    const t = clickEvent.value.target as { toGlobal?: (pos: { x: number, y: number }) => { x: number, y: number }, height?: number, [key: string]: any }
    const source = t['source']
    if (source instanceof Bar && typeof t.toGlobal === 'function' && typeof t.height === 'number') {
      const p = t.toGlobal({ x: 0, y: 0 })
      console.log('scrolling to bar', p.x, p.y)
      barPopover.value.$el.style.left = `${p.x}px`
      barPopover.value.$el.style.top = `${p.y + t.height}px`
    } else if (source instanceof Note) {
      console.log('scrolling to Note')
    }
  }
})


</script>

<template>
  <div class="right-column">
    <ToolBar />
    <div ref="canvasContainerRef" id="canvas-wrapper" style="position: relative;">
      <div id="beat-marker" v-if="playbackMarker != null" :style="playCursorStyle"></div>
      <button class="fullscreen-btn" @click="toggleFullscreen" title="Toggle Fullscreen">⛶</button>
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
      <p-panel ref="barPopover">
        <p>foo</p>
      </p-panel>
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

.p-panel {
  position: absolute;
  top: 0px;
  display: none;
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
.fullscreen-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  background: rgba(255,255,255,0.7);
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 1.2em;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.fullscreen-btn:active {
  background: #eee;
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
  -webkit-overflow-scrolling: touch;
}

#canvas-wrapper {
  /* ...existing code... */
  scrollbar-width: thick;           /* Firefox */
  /* scrollbar-color: #888 #f0f0f0;    Firefox */
}

/* Chrome, Edge, Safari (WebKit browsers) */
#canvas-wrapper::-webkit-scrollbar {
  width: 24px;                      /* Make scrollbar wider */
}

#canvas-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 9px;
}

#canvas-wrapper::-webkit-scrollbar-track {
  background: #f0f0f0;
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
  touch-action: auto;
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

.fret-option {
  padding: 8px;
  margin-right: 4px;
}
</style>
