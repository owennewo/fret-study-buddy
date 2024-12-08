import type { Bar } from '@/models/Bar'
import { useCursor } from '../useCursor'
import { useSVG } from '../useSVG'

const { score, track, bar, barId, voice, voiceId, element, elementId, note, resetCursor } = useCursor()
const { drawScore } = useSVG()

export const useBarKeys = () => {
  let copyBar: Bar | null = null

  const barHandler = (event: KeyboardEvent) => {
    const pressedKey = event.key

    switch (pressedKey) {
      case 'ArrowUp':
        barId.value = Math.max(bar.value.index() - score.value.barsPerLine, 0)
        elementId.value = 0
        // const upBar = bar.value!._track._bars[Math.max(bar.value!.index() - score.value.barsPerLine, 0)]
        // note.value = upBar._voices[voiceId.value]._elements[element.value!.index()]._notes[note.value!.index()]
        resetCursor()
        drawScore()
        break
      case 'ArrowDown':
        // const downBarIndex = Math.min(bar.value!.index() + score.value.barsPerLine, track.value!._bars.length - 1)
        // const downBar = bar.value!._track._bars[downBarIndex]
        // note.value = downBar._voices[voiceId.value]._elements[element.value!.index()]._notes[note.value!.index()]
        barId.value = Math.min(bar.value.index() + score.value.barsPerLine, track.value!._bars.length - 1)
        elementId.value = 0
        resetCursor()
        drawScore()
        break
      case 'ArrowRight':
        barId.value = bar.value.index() + 1
        elementId.value = 0
        // barId.value = Math.min(bar.value.index() + 1, track.value!._bars.length - 1)

        // const nextBar = bar.value!.next()
        // if (nextBar !== bar.value) {
        //   note.value = nextBar!._voices[voiceId.value]._elements[element.value!.index()]._notes[note.value!.index()]
        resetCursor()
        drawScore()
        // }
        break
      case 'ArrowLeft':
        barId.value = Math.max(bar.value.index() - 1, 0)
        elementId.value = 0
        // const prevBar = bar.value!.prev()
        // if (prevBar !== bar.value) {
        //   note.value = prevBar._voices[voiceId.value]._elements[element.value!.index()]._notes[note.value!.index()]
        resetCursor()
        drawScore()
        // }
        break
      case 'Delete':
        track.value!.removeBarAt(bar.value!.index())

        drawScore()
        break
      case 'c':
        copyBar = bar.value!.clone()
        console.log('copyBar', copyBar)
        break
      case 'Insert':
        if (copyBar) {
          track.value!.addBar(bar.value!.index() + 1, copyBar)
          drawScore()
        }
        break
      default:
        if (typeof pressedKey === 'number') {
          console.log('bar received number')
        } else {
          console.log('bar: unhandled key:', pressedKey)
        }
    }
  }

  return { barHandler }
}
