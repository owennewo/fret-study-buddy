
<script setup lang="ts">
import { useFretboard } from '@/composables/useFretboard'
import { onMounted } from 'vue';

const { fretboardRef, drawFretboard } = useFretboard()

onMounted(() => {
  drawFretboard()
})

</script>
<template>
<canvas ref="fretboardRef" class="theFretboard"></canvas>
</template>
<style>
.theFretboard {
  width: 100%;
  height: 100%;
  border: 1px solid blueviolet;
  background-color: brown;
}
</style>
