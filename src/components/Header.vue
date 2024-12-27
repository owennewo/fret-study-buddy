<script setup lang="ts">
import { ref } from 'vue'
import { useSound } from '@/composables/useSound'
import { useCursor } from '@/composables/useCursor'

const { score } = useCursor()

const { play, pause, isPlaying } = useSound()

const isDarkMode = ref(false)

const errorPopover = ref()

const toggleSidebar = () => {
  console.log('toggleSidebar')
  document.body.classList.toggle('sidebar-open')
}

const toggleMode = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
}

const toggleErrorPopover = event => {
  errorPopover.value.toggle(event)
}
</script>
<template>
  <header>
    <p-toolbar>
      <template #start>
        <div class="svg-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            width="32"
            height="32"
            class="icon-background"
            style="background-color: var(--p-toolbar-background, white)"
          >
            <polygon
              points="10,0 54,0 64,28 64,58 54,58 54,64 10,64 10,58 0,58 0,28"
              rx="5"
              class="icon-primary"
            ></polygon>
            <circle cx="22" cy="16" r="5" class="icon-secondary" />
            <circle cx="14" cy="40" r="5" class="icon-secondary" />
            <circle cx="42" cy="16" r="5" class="icon-secondary" />
            <circle cx="50" cy="40" r="5" class="icon-secondary" />

            <line x1="14" x2="20" y1="40" y2="54" class="icon-secondary" />
            <line x1="20" x2="20" y1="54" y2="64" class="icon-secondary" />

            <line x1="22" x2="28" y1="16" y2="54" class="icon-secondary" />
            <line x1="28" x2="28" y1="54" y2="64" class="icon-secondary" />

            <line x1="42" x2="36" y1="16" y2="54" class="icon-secondary" />
            <line x1="36" x2="36" y1="54" y2="64" class="icon-secondary" />

            <line x1="50" x2="44" y1="40" y2="54" class="icon-secondary" />
            <line x1="44" x2="44" y1="54" y2="64" class="icon-secondary" />
          </svg>
        </div>
      </template>
      <template #center>
        <div class="toolbar-center">
          <p-button v-if="!isPlaying" icon="pi pi-play" class="settings-button" @click="play" />
          <p-button v-if="isPlaying" icon="pi pi-pause" class="settings-button" @click="pause" />

          <p-badge
            v-if="score?.errors().length > 0"
            @click="toggleErrorPopover"
            severity="danger"
            size="xlarge"
            :value="score?.errors().length"
          ></p-badge>
        </div>
      </template>
      <template #end>
        <p-button @click="toggleMode" :icon="`pi ${isDarkMode ? 'pi-sun' : 'pi-moon'}`" />
        <!-- <p-button @click="toggleMode" v-model="isDarkMode" :icon=`pi {isDarkMode? 'pi-sun': 'pi-moon'}` /> -->
        <!-- <p-togglebutton @click="toggleMode" v-model="isDarkMode" onLabel="Light" offLabel="Dark" /> -->
        <button class="p-button p-button-text" @click="toggleSidebar">
          <i class="pi pi-bars"></i>
        </button>
      </template>
    </p-toolbar>
    <p-popover ref="errorPopover">
      <p-datatable :value="score?.errors()" tableStyle="min-width: 50rem">
        <p-column field="track" header="Track" class="w-1/6"></p-column>
        <p-column field="bar" header="Bar" class="w-1/6"></p-column>
        <p-column field="voice" header="Voice" class="w-1/6" bodyClass="whitespace-nowrap"></p-column>
        <p-column field="error" header="Error" sortable class="w-1/6">
          <template #body="slotProps">
            Duration is {{ slotProps.data.duration() }} beat (expecting {{ slotProps.data.expectedDuration }})
          </template>
        </p-column>
      </p-datatable>
    </p-popover>
  </header>
</template>

<style scoped>
.toolbar-center {
  display: flex;
  align-items: center;
  gap: 10px; /* Adjust spacing as needed */
}

polygon.icon-primary {
  fill: #930606;
}

circle.icon-secondary {
  fill: var(--p-toolbar-background, white);
}

line.icon-secondary {
  stroke: var(--p-toolbar-background, white);
  fill: var(--p-toolbar-background, white);
  stroke-width: 4;
}

table.debug {
  border: 1px solid black;
  border-collapse: collapse;
  /* margin: 0 auto; */
  tr,
  th,
  td {
    border: 1px solid lightgray;
  }
}
</style>
