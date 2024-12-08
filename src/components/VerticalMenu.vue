<script setup lang="ts">
import { useCursor } from '@/composables/useCursor'
import { useSound } from '@/composables/useSound'
import { computed, ref } from 'vue'

const isDarkMode = ref(false)
const errorPopover = ref()
const { score, mode } = useCursor()

const { play, pause, isPlaying } = useSound()

const menuItems = computed(() => [
  { name: 'Open', icon: 'pi pi-database' },
  { name: 'Score', icon: 'pi pi-book' },
  { name: 'Track', icon: 'pi pi-wave-pulse' },
  { name: 'Bar', icon: 'pi pi-ticket' },
  { name: 'Voice', icon: 'pi pi-megaphone' },
  { name: 'Element', icon: 'pi pi-tags' },
  { name: 'Note', icon: 'pi pi-tiktok' },
  {
    name: isPlaying.value ? 'Pause' : 'Play',
    icon: isPlaying.value ? 'pi pi-pause' : 'pi pi-play',
    command: isPlaying.value ? pause : play,
  },
  {
    name: isDarkMode.value ? 'Light mode' : 'Dark mode',
    icon: isDarkMode.value ? 'pi pi-sun' : 'pi pi-moon',
    command: () => {
      isDarkMode.value = !isDarkMode.value
      document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
    },
  },

  { name: 'Show sidepanel', icon: 'pi pi-bars', command: toggleSideBar },
])

const toggleSideBar = () => {
  document.body.classList.toggle('sidebar-open')
}

const toggleErrorPopover = event => {
  errorPopover.value.toggle(event)
}

const menuClicked = (menuIndex, item) => {
  mode.value = menuIndex
  if (item.command) {
    item.command()
  }
}
</script>

<template>
  <div class="menu-container">
    <ul>
      <li>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          width="16"
          height="16"
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
      </li>
      <li
        v-for="(item, index) in menuItems"
        :key="item.name"
        :class="index == mode ? 'menuitem active' : 'menuitem'"
        @click="menuClicked(index, item)"
      >
        <i :class="item.icon" v-tooltip="item.name"></i>
      </li>
      <li>
        <p-badge
          v-if="score?.errors().length > 0"
          @click="toggleErrorPopover"
          severity="danger"
          size="medium"
          :value="score?.errors().length"
        ></p-badge>
      </li>
    </ul>
  </div>
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
</template>
<style>
.menu-container {
  display: flex;
  flex-direction: column;
  justify-content: top;
  align-items: center;
  height: auto;
  width: 80px;
  /* padding-top: 40px; */
  background-color: var(--background-color);
  border: none; /* 1px solid var(--border-color); */
  border-radius: 20px;
  margin: 10px;
  ul {
    display: flex;
    margin: 30px;
    flex-direction: column;
    gap: 10px;
    padding: 0;
  }
  li {
    border: 2px solid black;
    border-radius: 10px;
    list-style-type: none;
    padding: 10px;
    align-self: center;
    cursor: pointer;
  }
}

i.pi {
  font-size: 16px;
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

.menuitem.active {
  background-color: var(--foreground-color, white);
  border-radius: 10px;
}
.menuitem:hover {
  background-color: var(--foreground-hover-color, white);
  border-radius: 10px;
}

.menuitem:hover i {
  color: var(--background-color);
}

.menuitem.active i {
  color: var(--background-color);
}
</style>
