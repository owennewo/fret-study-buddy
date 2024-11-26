import type { Bar } from '@/models/Bar'
import type { NotePosition } from '@/models/NotePosition'
import { Score } from '@/models/Score'
import type { Track } from '@/models/Track'
import type { Voice } from '@/models/Voice'
import type { VoiceElement } from '@/models/VoiceElement'
// import type { NotePosition } from '@/models/NotePosition'
import { ref, watch, type Ref } from 'vue'

const project: Ref<string> = ref('')
const score: Ref<Score> = ref(Score.new())
const trackId: Ref<number> = ref(0)
const track: Ref<Track | null> = ref(null)
const bar: Ref<Bar | null> = ref(null)
const voice: Ref<Voice | null> = ref(null)
const voiceId: Ref<number> = ref(0)
const element: Ref<VoiceElement | null> = ref(null)
const note: Ref<NotePosition | null> = ref(null)

export const useCursor = () => {
  const resetCursor = () => {
    if (score.value) {
      if (note.value == null) {
        console.log('@@@@@ note is null')
        const startTrack = score.value.tracks[trackId.value]
        if (startTrack.bars.length == 0) {
          startTrack.addBar()
        }
        const startBar = startTrack.bars[0]
        if (startBar.voices.length == 0) {
          startBar.addVoice()
        }
        const startVoice = startBar.voices[0]
        if (startVoice.elements.length == 0) {
          startVoice.addElement()
        }
        note.value = startVoice.elements[0].notes[0]
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
      console.log('resetting', score.value)
    }
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
    voice,
    voiceId,
    element,
    note,
    resetCursor,
  }
}
