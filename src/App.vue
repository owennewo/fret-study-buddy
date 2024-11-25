<script setup lang="ts">
import Header from './components/Header.vue'
import SVGFrame from './components/SVGFrame.vue'
</script>

<template>
  <main>
    <p-toast />
    <Header></Header>
    <SVGFrame></SVGFrame>
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Make main container full viewport height */
}

header {
  line-height: 1.5;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }
}
</style>
