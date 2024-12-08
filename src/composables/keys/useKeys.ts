import { Score } from '@/models/Score'
import { computed } from 'vue'
import * as d3 from 'd3'
import { useCursor } from '../useCursor'
import { useToast } from 'primevue/usetoast'
import { useBarKeys } from './useBarKeys'
import { useNoteKeys } from './useNoteKeys'
import { useTrackKeys } from './useTrackKeys'
import { useVoiceKeys } from './useVoiceKeys'

export const useKeys = () => {
  const { score, track, trackId, bar, voiceId, element, note, mode, Mode, resetCursor } = useCursor()

  const { barHandler } = useBarKeys()
  const { noteHandler } = useNoteKeys()
  const { trackHandler } = useTrackKeys()
  const { voiceHandler } = useVoiceKeys()

  const toast = useToast()

  const selectedTrack = computed(() => {
    return score.value._tracks[trackId.value]
  })

  const handleKeys = (event: KeyboardEvent) => {
    const pressedKey = event.key
    const isCtrlPressed = event.ctrlKey || event.metaKey

    if (isCtrlPressed && pressedKey == 'n') {
      score.value = Score.new()
      event.preventDefault()
    }
    if (!score.value || !track.value || !bar.value || !note.value || !element.value || voiceId.value == null) {
      debugger
      return
    }

    switch (event.key) {
      case 'o':
        mode.value = Mode.ModeOpen
        return
      case 's':
        mode.value = Mode.ModeScore
        return
      case 't':
        mode.value = Mode.ModeTrack
        return
      case 'b':
        mode.value = Mode.ModeBar
        return
      case 'v':
        mode.value = Mode.ModeVoice
        return
      case 'e':
        mode.value = Mode.ModeElement
        return
      case 'n':
        mode.value = Mode.ModeNote
        return
      case 'p':
        mode.value = Mode.ModePlay
        return
      case 'd':
        mode.value = Mode.ModeDark
        return
      default:
        switch (mode.value) {
          case Mode.ModeOpen:
            return
          case Mode.ModeScore:
            return
          case Mode.ModeTrack:
            trackHandler(event)
            return

          case Mode.ModeBar:
            barHandler(event)
            return
          case Mode.ModeVoice:
            voiceHandler(event)
            return
          case Mode.ModeElement:
            return
          case Mode.ModeNote:
            noteHandler(event)
            return
          case Mode.ModePlay:
            return
          case Mode.ModeDark:
            return
        }
    }
  }

  d3.select(window).on('keydown', handleKeys)

  return { handleKeys }
}
