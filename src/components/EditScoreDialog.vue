<script setup lang="ts">
import { useCursor } from '@/composables/useCursor'

const { score } = useCursor()
import { instruments } from '@/models/Instruments'
import { computed } from 'vue'

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
  if (score.value._tracks.length > 1) {
    score.value._tracks.splice(index, 1)
  }
}
</script>

<template>
  <p-floatlabel variant="on">
    <p-inputtext v-model="score.title" inputId="title" variant="filled" />
    <label for="title">Title</label>
  </p-floatlabel>
  <p-floatlabel variant="on">
    <p-inputtext v-model="score.url" inputId="url" variant="filled" style="width: 200px" />
    <a v-if="score.url" :href="score.url" target="_blank" class="p-button-icon" style="float: right">
      <i class="pi pi-external-link"></i>
    </a>
    <label for="url">Url</label>
  </p-floatlabel>

  <p-floatlabel variant="on">
    <p-inputnumber v-model="score.tempo" inputId="tempo" variant="filled" :min="1" :step="5" showButtons />
    <label for="tempo">Tempo</label>
  </p-floatlabel>
  <p-floatlabel variant="on">
    <p-inputnumber v-model="score.barsPerLine" id="barsPerLine" variant="filled" :min="1" showButtons />
    <label for="barsPerLine">Bars per Line</label>
  </p-floatlabel>
  <p-floatlabel variant="on">
    <p-inputnumber v-model="score.fontSize" id="fontSize" :min="4" showButtons :step="2" variant="filled" />
    <label for="fontSize">Font size</label>
  </p-floatlabel>

  <p-floatlabel variant="on">
    <p-inputgroup>
      <p-inputnumber
        v-model="score.timeSignature.beatsPerBar"
        placeholder="Beats per Bar"
        :min="1"
        showButtons
        class="small"
        variant="filled"
      />
      <p-inputnumber
        v-model="score.timeSignature.beatValue"
        placeholder="Beat Value"
        :min="1"
        showButtons
        class="small"
        variant="filled"
      />
    </p-inputgroup>

    <label>Time Signature</label>
  </p-floatlabel>

  <p-tabs :value="0">
    <p-tablist>
      <p-tab v-for="(track, index) in score._tracks" :key="index" :value="index">Track {{ index }}</p-tab>
      <p-tab :value="1">
        <p-button icon="pi pi-plus" class="p-button-text add-track-icon" @click="addTrack" />
      </p-tab>
    </p-tablist>
    <p-tabpanels>
      <p-tabpanel v-for="(track, index) in score._tracks" :key="index" :value="index" class="vertically-spaced">
        <p-floatlabel variant="on">
          <p-select
            v-model="track.instrument.instrumentName"
            :options="instrumentOptions"
            inputId="instrument"
            :id="'instrument-' + index"
            placeholder="Select Instrument"
          />
          <label for="instrument">Instrument</label>
        </p-floatlabel>
        <p-floatlabel variant="on">
          <p-select
            v-model="track.instrument.tuningName"
            :options="tuningOptions(track.instrument.instrumentName)"
            :id="'tuning-' + index"
            placeholder="Select Tuning"
          />
          <label :for="'tuning-' + index">Tuning</label>
        </p-floatlabel>
        <p-floatlabel variant="on">
          <p-select
            v-model="track.instrument.toneName"
            :options="toneOptions(track.instrument.instrumentName)"
            :id="'tone-' + index"
            placeholder="Select Tone"
          />
          <label :for="'tone-' + index">Tone</label>
        </p-floatlabel>
      </p-tabpanel>
      <p-tabpanel :value="score._tracks.length"> </p-tabpanel>
    </p-tabpanels>
  </p-tabs>
</template>
