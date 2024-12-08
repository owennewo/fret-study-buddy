import { useCursor } from '../useCursor'
import { useSVG } from '../useSVG'

const { track, bar, voice, voiceId, element, note, resetCursor } = useCursor()
const { drawScore } = useSVG()

export const useVoiceKeys = () => {
  const voiceHandler = (event: KeyboardEvent) => {
    const pressedKey = event.key

    switch (pressedKey) {
      case 'ArrowUp':
        voiceId.value = Math.max(voiceId.value - 1, 0)
        resetCursor()
        drawScore()
        return
      case 'ArrowDown':
        voiceId.value = Math.min(voiceId.value + 1, track.value.voiceCount - 1)
        resetCursor()
        drawScore()
      case 'ArrowRight':
      case 'ArrowLeft':
        return
      default:
        if (typeof pressedKey === 'number') {
          console.log('voice received number')
        } else {
          console.log('voice: unhandled key:', pressedKey)
        }
    }
  }

  return { voiceHandler }
}
