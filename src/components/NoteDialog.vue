<script setup lang="ts">
import { useCursor } from '@/composables/useCursor'
import { BaseNoteValue } from '@/models/Duration'
import { Technique } from '@/models/Note'
import { computed } from 'vue'

const { bar, element, note } = useCursor()

const baseDurationOptions = computed(() => {
  return Object.keys(BaseNoteValue)
    .filter(key => isNaN(Number(key))) // Exclude numeric reverse mapping if TypeScript emits it
    .map(key => ({
      label: key,
      value: BaseNoteValue[key as keyof typeof BaseNoteValue],
    }))
})

const techniqueList = () => {
  const t = Object.entries(Technique).map(([name, key]) => {
    return {
      key: key as string,
      name,
    }
  })
  // debugger
  return t
}
</script>

<template>
  <div class="field">
    <label>Time Signature</label>

    <div v-if="bar" class="field-group">
      <p-inputnumber
        v-model="bar.timeSignature.beatsPerBar"
        placeholder="Beats per Bar"
        :min="1"
        showButtons
        class="small"
      />
      <span>&nbsp;/&nbsp;</span>
      <p-inputnumber
        v-model="bar.timeSignature.beatValue"
        placeholder="Beat Value"
        :min="1"
        showButtons
        class="small"
      />
    </div>
  </div>

  <p-floatlabel variant="on">
    <p-select
      v-model="element.duration.baseDuration"
      :options="baseDurationOptions"
      optionLabel="label"
      optionValue="value"
      inputId="baseUnit"
      placeholder="Base Unit"
      class="w-full"
    >
    </p-select>

    <label for="duration">Duration</label>
  </p-floatlabel>
  <p-floatlabel variant="on">
    <p-inputnumber
      v-model="element.duration.dotCount"
      inputId="dotCount"
      variant="filled"
      :min="0"
      :max="2"
      :step="1"
      showButtons
    />
    <label for="dotCount">dotCount</label>
  </p-floatlabel>
  <p-floatlabel variant="on">
    <p-checkbox v-model="element.duration.isTriplet" binary inputId="isTriplet" />
    <label for="isTriplet">isTriplet</label>
  </p-floatlabel>

  <p-inputnumber v-model="note.fretNumber" placeholder="Duration" showButtons class="small" />
  <p-inputnumber v-model="note.leftHandFinger" placeholder="leftHandFinger" showButtons class="small" />
  <p-inputnumber v-model="note.rightHandFinger" placeholder="rightHandFinger" showButtons class="small" />

  <p-multiselect
    v-model="note.techniques"
    :options="techniqueList()"
    optionLabel="name"
    optionValue="key"
    inputId="techniqueSelect"
    placeholder="Select Techniques"
    display="chip"
    :showToggleAll="false"
    class="w-full"
  >
  </p-multiselect>
</template>
