import type { Score } from '@/models/Score'
// import type { NotePosition } from '@/models/NotePosition'
import { ref, type Ref } from 'vue'

const project: Ref<string | null> = ref(null)
const score: Ref<Score | null> = ref(null)
const track = ref(null)
const bar = ref(null)
const voice = ref(null)
const voiceId = ref(0)
const element = ref(null)
const note = ref(null)

export const useCursor = () => {
  const resetCursor = () => {
    if (score.value) {
      if (note.value == null) {
        console.log('@@@@@ note is null')
        note.value = score.value.tracks[0].bars[0].voices[0].elements[0].notes[0]
      }

      track.value = note.value._element._voice._bar._track
      bar.value = note.value._element._voice._bar

      const currentVoice = note.value._element._voice

      if (currentVoice.index() == voiceId.value) {
        console.log('@@@@@ note is same voice')
        voice.value = currentVoice
        element.value = note.value._element
      } else {
        if (bar.value.voices.length > 1 && bar.value.voices[1] === bar.value.voices[0]) {
          console.error('@@@@@ bar has multiple voices but they are the same')
          debugger
        }
        console.log('@@@@@ Switching voice')
        if (voiceId.value > bar.value.voices.length - 1) {
          console.log('@@@@@ extending bar')
          voice.value = bar.value.addVoice()
        } else {
          voice.value = bar.value.voices[voiceId.value]
        }
        if (voice.value.elements.length == 0) {
          console.log('@@@@@ Extending voice')
          voice.value.addElement()
        }
        element.value = voice.value.elements[Math.min(voice.value.elements.length - 1, note.value._element.index())]
        note.value = element.value.notes[Math.min(element.value.notes.length - 1, note.value.index())]
        note.value.debug()
      }

      // track.value = score.value.tracks[0]
      //   bar.value = track.value.bars[0]
      //   voice.value = bar.value.voices[0]
      //   if (voice.value.elements.length == 0) {
      //     voice.value.extend()
      //   }
      //   element.value = voice.value.elements[0]
      //   console.log('note is null')
      //   element.value.notes[0]
      // }
    }
  }

  return {
    project,
    score,
    track,
    bar,
    voice,
    voiceId,
    element,
    note,
    resetCursor,
  }
  // }
}
