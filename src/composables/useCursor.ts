import type { Bar } from '@/models/Bar'
import type { NotePosition } from '@/models/NotePosition'
import { Score } from '@/models/Score'
import type { Track } from '@/models/Track'
import type { Voice } from '@/models/Voice'
import type { VoiceElement } from '@/models/VoiceElement'
// import type { NotePosition } from '@/models/NotePosition'
import { computed, ref, watch, type Ref } from 'vue'

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
const trackId: Ref<number> = ref(0)
const barId: Ref<number> = ref(0)
const voiceId: Ref<number> = ref(0)
const elementId: Ref<number> = ref(0)
const noteId: Ref<number> = ref(0)

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

  return voice.value._elements[elementId.value]
})

const note = computed(() => {
  if (noteId.value > element.value._notes.length - 1) {
    debugger
  }

  return element.value._notes[noteId.value]
})

// const track: Ref<Track | null> = ref(null)
// const bar: Ref<Bar | null> = ref(null)
// const voice: Ref<Voice | null> = ref(null)

// const element: Ref<VoiceElement | null> = ref(null)
// const note: Ref<NotePosition | null> = ref(null)
const mode: Ref<Mode> = ref(Mode.ModeNote)

export const useCursor = () => {
  const resetCursor = () => {
    // debugger

    // if (score.value) {
    //   if (note.value == null) {
    //     console.log('@@@@@ note is null')
    //     const startTrack = score.value._tracks[trackId.value]
    //     if (startTrack._bars.length == 0) {
    //       startTrack.addBar()
    //     }
    //     const startBar = startTrack._bars[0]
    //     if (startBar._voices.length == 0) {
    //       startBar.addVoice()
    //     }
    //     const startVoice = startBar._voices[0]
    //     if (startVoice._elements.length == 0) {
    //       startVoice.addElement()
    //     }
    //     note.value = startVoice._elements[0]._notes[0]
    //   }

    //   track.value = note.value.track()
    //   bar.value = note.value.bar()

    //   const currentVoice = note.value.voice()

    //   if (currentVoice.index() == voiceId.value) {
    //     voice.value = currentVoice
    //     element.value = note.value.element()
    //   } else {
    //     if (bar.value._voices.length > 1 && bar.value._voices[1] === bar.value._voices[0]) {
    //       console.error('@@@@@ bar has multiple voices but they are the same')
    //       debugger
    //     }
    //     console.log('@@@@@ Switching voice')
    //     if (voiceId.value > bar.value._voices.length - 1) {
    //       console.log('@@@@@ extending bar')
    //       voice.value = bar.value.addVoice()
    //     } else {
    //       voice.value = bar.value._voices[voiceId.value]
    //     }
    //     if (voice.value._elements.length == 0) {
    //       console.log('@@@@@ Extending voice')
    //       voice.value.addElement()
    //     }
    //     element.value = voice.value._elements[Math.min(voice.value._elements.length - 1, note.value.element().index())]
    //     note.value = element.value._notes[Math.min(element.value._notes.length - 1, note.value.index())]
    //     note.value.debug()
    //   }
    console.log('reset')
    // }
  }

  watch(voiceId, () => {
    console.log('switching voiceId', voiceId.value, voice.value?.index())
    resetCursor()
  })

  watch(score, () => {
    score.value?.verify()
    console.log('@@@@@ score changed')
  })

  return {
    project,
    score,
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
    mode,
    Mode,
    resetCursor,
  }
}
