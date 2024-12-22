<script setup lang="ts">
import CanvasFrame from './components/CanvasFrame.vue'
import SidePanel from './components/SidePanel.vue'
import VerticalMenu from './components/VerticalMenu.vue'
</script>

<template>
  <p-toast />

  <!-- <div class="wrapper"> -->
  <!-- <VerticalMenu></VerticalMenu> -->
  <!-- <main> -->
  <SidePanel></SidePanel>
  <CanvasFrame></CanvasFrame>
  <!-- </main> -->
  <!-- </div> -->
</template>

<style scoped>
.wrapper {
  margin: 5px;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  display: flex;
  flex-direction: row;
}
</style>
