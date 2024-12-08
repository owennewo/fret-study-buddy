import { useCursor } from '../useCursor'
import { useSVG } from '../useSVG'

const { track, trackId, bar, voice, voiceId, element, note, resetCursor } = useCursor()
const { drawScore } = useSVG()

export const useTrackKeys = () => {
  const trackHandler = (event: KeyboardEvent) => {
    const pressedKey = event.key

    switch (pressedKey) {
      case 'ArrowUp':
        trackId.value = Math.max(track.value.index() - 1, 0)
        return
      case 'ArrowDown':
        trackId.value = Math.min(track.value.index() + 1, track.value.score()._tracks.length - 1)
        return
      case 'ArrowRight':
      case 'ArrowLeft':
        // const nextTrack = track.value!.next()
        // if (nextTrack !== track.value) {
        //   note.value =
        //     nextTrack._bars[Math.min(bar.value!.index(), nextTrack._bars.length - 1)]._voices[voiceId.value]._elements[
        //       element.value!.index()
        //     ]._notes[note.value!.index()]
        //   resetCursor()
        //   drawScore()
        // }
        return
      default:
        if (typeof pressedKey === 'number') {
          console.log('track received number')
        } else {
          console.log('track: unhandled key:', pressedKey)
        }
    }
  }

  return { trackHandler }
}
