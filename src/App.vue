<script setup lang="ts">
import Header from './components/Header.vue'
import SVGFrame from './components/SVGFrame.vue'
import SidePanel from './components/SidePanel.vue'
import Footer from './components/Footer.vue'
</script>

<template>
  <p-toast />
  <Header></Header>
  <main>
    <SVGFrame></SVGFrame>
    <!-- <div class="frame">somthing</div> -->
    <SidePanel></SidePanel>
  </main>
  <Footer></Footer>
</template>

<style scoped></style>
