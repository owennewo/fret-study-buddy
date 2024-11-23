<script setup>
import { computed, watch, toRef, toRefs } from 'vue'
import { instruments } from '@/models/Instruments'
import { useCursor } from '@/composables/useCursor'

// import { useIndexedDBStore } from '@/stores/useIndexedDBStore'

const { score } = useCursor()

const props = defineProps({
  visible: Boolean,
})

const visible = toRef(props, 'visible')
const emit = defineEmits(['update:visible', 'save'])

const instrumentOptions = computed(() => Object.keys(instruments))

const tuningOptions = instrumentName => {
  if (!instrumentName) return []
  return Object.keys(instruments[instrumentName].tunings)
}

const toneOptions = instrumentName => {
  if (!instrumentName) return []
  return Object.keys(instruments[instrumentName].tones)
}

const addTrack = () => {
  score.value.addTrack()
}

const removeTrack = index => {
  if (score.value.tracks.length > 1) {
    score.value.tracks.splice(index, 1)
  }
}

const onClose = () => emit('update:visible', false)

const handleEvent = event => {
  const pressedKey = event.key
  if (pressedKey === 'Escape') {
    onClose()
  }
  event.stopPropagation()
}

watch(visible, () => {
  console.log('visible', visible)
})
</script>

<template>
  <p-dialog
    header="Settings"
    modal
    :visible="props.visible"
    @update:visible="onClose"
    @hide="onClose"
    @keydown="handleEvent"
  >
    <div class="settings-dialog-content">
      <div class="field">
        <label for="title">Title</label>
        <p-inputtext v-model="score.title" id="title" />
      </div>

      <div class="field">
        <label for="tempo">Tempo</label>
        <p-inputnumber v-model="score.tempo" id="tempo" :min="1" />
        <!-- </div>

      <div class="field"> -->
        <label for="barsPerLine">Bars per Line</label>
        <p-inputnumber v-model="score.barsPerLine" id="barsPerLine" :min="1" showButtons />
      </div>

      <div class="field">
        <label>Time Signature</label>
        <div class="field-group">
          <p-inputnumber v-model="score.timeSignature.beatsPerBar" placeholder="Beats per Bar" :min="1" showButtons />
          <span>/</span>
          <p-inputnumber v-model="score.timeSignature.beatValue" placeholder="Beat Value" :min="1" showButtons />
        </div>
      </div>

      <p-tabs :value="0">
        <p-tablist>
          <p-tab v-for="(track, index) in score.tracks" :key="index" :value="index">Track {{ index }}</p-tab>
          <p-tab :value="1">
            <p-button icon="pi pi-plus" class="p-button-text add-track-icon" @click="addTrack" />
          </p-tab>
        </p-tablist>
        <p-tabpanels>
          <p-tabpanel v-for="(track, index) in score.tracks" :key="index" :value="index">
            <div class="field">
              <label>Instrument</label>
              <div class="field-group">
                <!-- <div class="field">
                  <label :for="'instrument-' + index">Instrument</label> -->
                <p-select
                  v-model="track.instrument.instrumentName"
                  :options="instrumentOptions"
                  :id="'instrument-' + index"
                  placeholder="Select Instrument"
                />
                <!-- </div>

                <div class="field"-->
                <label :for="'tuning-' + index">Tuning</label>
                <p-select
                  v-model="track.instrument.tuningName"
                  :options="tuningOptions(track.instrument.instrumentName)"
                  :id="'tuning-' + index"
                  placeholder="Select Tuning"
                />

                <!-- <div class="field">
                    <label :for="'tone-' + index">Tone</label> -->
                <p-select
                  v-model="track.instrument.toneName"
                  :options="toneOptions(track.instrument.instrumentName)"
                  :id="'tone-' + index"
                  placeholder="Select Tone"
                />
                <!-- </div> -->
                <!-- </div> -->
              </div>

              <div class="field">
                <label for="voiceCount">Voice Count</label>
                <p-inputnumber v-model="track.voiceCount" id="voiceCount" :min="1" :max="4" showButtons :step="1" />
              </div>
            </div>
          </p-tabpanel>
          <p-tabpanel :value="score.tracks.length"> </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>

    <template #footer>
      <p-button label="Close" icon="pi pi-times" class="p-button-secondary" @click="onClose()" />
    </template>
  </p-dialog>
</template>

<style scoped>
.settings-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
}
.field-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.delete-button {
  margin-left: 0.5rem;
}
.add-track-icon {
  font-size: 1.2rem;
  padding: 0;
  color: var(--primary-color);
}
</style>
