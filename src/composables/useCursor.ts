import { Score } from '@/models/Score'
import type { VoiceElement } from '@/models/VoiceElement'
import { computed, ref, toRaw, type Ref } from 'vue'

enum Mode {
  ModeOpen = 0,
  ModeScore = 1,
  ModeTrack = 2,
  ModeBar = 3,
  ModeVoice = 4,
  ModeElement = 5,
  ModeNote = 6,
  ModePlay = 7,
  ModeDark = 8,
}

const project: Ref<string> = ref('')
const score: Ref<Score> = ref(Score.new())
const scoreId: Ref<number> = ref(-1)
const trackId: Ref<number> = ref(0)
const barId: Ref<number> = ref(0)
const voiceId: Ref<number> = ref(0)
const elementId: Ref<number> = ref(0)
const noteId: Ref<number> = ref(0)

const selection: Ref<Array<VoiceElement>> = ref([])

const track = computed(() => {
  if (trackId.value > score.value._tracks.length - 1) {
    debugger
  }
  return score.value._tracks[trackId.value]
})

const bar = computed(() => {
  while (barId.value > track.value._bars.length - 1) {
    track.value.addBar()
  }

  return track.value._bars[barId.value]
})

const voice = computed(() => {
  if (track.value._bars.length == 0) {
    track.value.addBar()
    barId.value = 0
  }
  if (voiceId.value > bar.value._voices.length - 1) {
    bar.value.addVoice()
  }
  return bar.value._voices[voiceId.value]
})

const element = computed(() => {
  if (elementId.value < 0) {
    // negative element, try to move to previous bar
    if (barId.value > 0) {
      barId.value = barId.value - 1
      elementId.value = voice.value._elements.length - 1
    } else {
      elementId.value = 0
    }
  }
  if (elementId.value > voice.value._elements.length - 1) {
    if (voice.value.isComplete()) {
      // no space, move to next bar?
      barId.value += 1
      elementId.value = 0
      if (barId.value > track.value._bars.length) {
        track.value.addBar()
      }
    } else {
      voice.value.addElement()
    }
  }
  if (elementId.value > voice.value._elements.length - 1) {
    //maybe possible?
    debugger
    elementId.value = Math.min(elementId.value, voice.value._elements.length - 1)
  }
  const currentElement = voice.value._elements[elementId.value]

  return currentElement
})

const note = computed(() => {
  if (noteId.value > element.value._notes.length - 1) {
    debugger
  }
  return element.value._notes[noteId.value]
})

const mode: Ref<Mode> = ref(Mode.ModeNote)

export const useCursor = () => {
  return {
    project,
    score,
    scoreId,
    track,
    trackId,
    bar,
    barId,
    voice,
    voiceId,

    element,
    elementId,
    note,
    noteId,
    selection,
    mode,
    Mode,
  }
}
