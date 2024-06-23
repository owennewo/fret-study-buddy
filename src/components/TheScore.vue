<script setup lang="ts">
import { ref, toRefs } from 'vue';
import { KEYS, MODES, POSITIONS, TUNINGS, INSTRUMENTS } from '../interfaces/music';

import { useStore } from '../stores/useStore';
import { useSound } from '../composables/useSound';
import { useGraphics } from '../composables/useGraphics';
import { useSpeech } from '../composables/useSpeech';

import Dropdown from 'primevue/dropdown';
import FloatLabel from 'primevue/floatlabel';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';

const svgRef = ref<SVGElement | null>(null);

const { options, score } = toRefs(useStore());
const { startContinuousArtyom } = useSpeech(options);

const { play } = useSound();
const { dimensions } = useGraphics(svgRef, options, score);

</script>

<template>
  <button @click="startContinuousArtyom">Start speech</button>
  <div class="svg-container">
    <svg ref="svgRef" xmlns="http://www.w3.org/2000/svg"
      :viewBox="'0 0 ' + (score.bars.length * dimensions.barWidth + dimensions.barPadding * 2) + ' ' + (dimensions.stringSpacing * (options.tuning.strings.length - 1) + dimensions.barPadding * 2)"
      width="100%">
    </svg>
  </div>

  <Toolbar class="options-toolbar">
    <template #start>
      <!-- <Button icon="pi pi-plus" class="mr-2" severity="secondary" />
      <Button icon="pi pi-print" class="mr-2" severity="secondary" />
      <Button icon="pi pi-upload" severity="secondary" /> -->
    </template>

    <template #center>
      <FloatLabel class="w-full md:w-14rem mr-2">
        <Dropdown v-model="options.tuning" inputId="dd-tuning" :options="INSTRUMENTS" optionGroupLabel="name"
          optionGroupChildren="tunings" optionLabel="shortName" class="w-full" />
        <label for="dd-tuning">{{ options.tuning.instrument }} tuning</label>
      </FloatLabel>
      <FloatLabel class="w-full md:w-14rem mr-2">
        <Dropdown v-model="options.key" inputId="dd-key" :options="KEYS" optionLabel="name" optionValue="index"
          class="w-full" />
        <label for="dd-key">Key</label>
      </FloatLabel>
      <FloatLabel class="w-full md:w-14rem mr-2">
        <Dropdown v-model="options.mode" inputId="dd-mode" :options="MODES" optionLabel="name" optionValue="index"
          class="w-full" />
        <label for="dd-mode">Mode</label>
      </FloatLabel>
      <FloatLabel class="w-full md:w-14rem mr-2">
        <Dropdown v-model="options.position" inputId="dd-position" :options="POSITIONS" optionLabel="name"
          optionValue="fret" class="w-full" />
        <label for="dd-position">Position</label>
      </FloatLabel>
    </template>

    <template #end>
      <div class="p-inputgroup">
        <InputNumber v-model="options.bpm" inputId="mile" suffix=" bpm" class="bpm" />
        <Button @click="play">PLAY</Button>
      </div>

    </template>
  </Toolbar>

</template>

<style scoped>
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
  /* display: block; */
  margin: 0 auto;
  background-color: #333;
}

line {
  stroke-width: 2;
  stroke: #eee;
}

text {
  fill: #ffffff;
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

.svg-container {
  flex: 1;
}
</style>
<style>
g.changing {
  opacity: 0.5;
}

.polynote>rect {
  fill: lightblue;
}

.polynote.active>rect {
  fill: green;
}
</style>