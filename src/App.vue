<script setup lang="ts">
import Header from './components/Header.vue'
import SVGFrame from './components/SVGFrame.vue'
import SidePanel from './components/SidePanel.vue'
import Footer from './components/Footer.vue'
import VerticalMenu from './components/VerticalMenu.vue'
</script>

<template>
  <p-toast />

  <div class="wrapper">
    <VerticalMenu></VerticalMenu>
    <!-- <Header></Header> -->
    <main>
      <SidePanel></SidePanel>
      <SVGFrame></SVGFrame>
    </main>
    <!-- <Footer></Footer> -->
  </div>
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
