import type { MusicalScore } from '@/models/MusicalScore'
import { ref, type Ref } from 'vue'

const project: Ref<string | null> = ref(null)
const score: Ref<MusicalScore | null> = ref(null)
const track = ref(null)
const bar = ref(null)
const voice = ref(null)
const element = ref(null)
const note = ref(null)

export const useCursor = () => {
  const resetCursor = () => {
    if (score.value) {
      track.value = score.value.tracks[0]
      bar.value = track.value.bars[0]
      voice.value = bar.value.voices[0]
      if (voice.value.elements.length == 0) {
        voice.value.extend()
      }
      element.value = voice.value.elements[0]
      note.value = element.value.notes[0]
    }
  }

  return {
    project,
    score,
    track,
    bar,
    voice,
    element,
    note,
    resetCursor,
  }
}
