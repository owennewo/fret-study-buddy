import type { Project } from '@/interfaces/DataStore'
import type { Bar } from '@/models/Bar'
import type { Note } from '@/models/Note'
import { Score } from '@/models/Score'
import type { VoiceElement } from '@/models/VoiceElement'
import { computed, ref, shallowRef, watch, type Ref, type ShallowRef } from 'vue'

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

const clientId: Ref<string> = ref('')
const project: Ref<Project | null> = ref(null)
const projectId: Ref<string> = ref('')
const projectName: Ref<string> = ref('')
const score: Ref<Score> = ref(Score.new())
const scoreId: Ref<string> = ref('')
const trackId: Ref<number> = ref(0)
const barId: Ref<number> = ref(0)
const voiceId: Ref<number> = ref(0)
const elementId: Ref<number> = ref(0)
const noteId: Ref<number> = ref(0)
const tempoPercent: Ref<number> = ref(100)
const isDarkMode = ref(false)
const isPlaybackLooping = ref(false)
const googleToken = ref()
const googleTokenExpiry = ref()
const playbackMarker = ref(0.0)

const selection: ShallowRef<Set<VoiceElement | Bar>> = shallowRef(new Set<VoiceElement | Bar>())

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
  if (barId.value < 0) {
    barId.value = 0
  }

  return track.value._bars[barId.value]
})

const voice = computed(() => {
  if (track.value._bars.length == 0) {
    track.value.addBar()
    barId.value = 0
  }
  if (voiceId.value > bar.value.voices().length - 1) {
    bar.value.addVoice()
  }
  return bar.value.voices()[voiceId.value]
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
      if (barId.value > track.value._bars.length - 1) {
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
    // return null;
  }
  return element.value._notes[noteId.value]
})

const barHeight = computed(() => {
  return score.value.fontSize * (track.value.stringCount() + 1)
})

// const refs = {
//   currentNote: ref<Note | null>(null),
//   clickEvent: ref<Event | null>(null),
// }

const setCursorNote = (note: Note) => {
  noteId.value = note.index()
  elementId.value = note.element().index()
  voiceId.value = note.voice().index()
  barId.value = note.bar().index()
  trackId.value = note.track().index()
  selection.value = new Set([note.element()]) // Set selection
}

// Add watches to log state changes
watch([noteId, elementId, voiceId, barId, trackId], ([newNoteId, newElementId, newVoiceId, newBarId, newTrackId]) => {
  console.log('State changed:', { newNoteId, newElementId, newVoiceId, newBarId, newTrackId })
})

watch(voiceId, () => {
  selection.value = new Set([])
})

const mode: Ref<Mode> = ref(Mode.ModeNote)

export const useCursor = () => {
  return {
    clientId,
    project,
    projectId,
    projectName,
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
    tempoPercent,
    isDarkMode,
    isPlaybackLooping,
    googleToken,
    googleTokenExpiry,
    setCursorNote,
    playbackMarker,
    barHeight,
  }
}
