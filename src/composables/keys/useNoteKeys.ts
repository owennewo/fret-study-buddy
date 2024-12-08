import { Technique } from '@/models/NotePosition'
import { useCursor } from '../useCursor'
import { useSVG } from '../useSVG'

const { track, bar, barId, voice, voiceId, element, elementId, note, noteId, resetCursor } = useCursor()
const { drawScore } = useSVG()

export const useNoteKeys = () => {
  let pressedNumbers = ''
  const noteHandler = (event: KeyboardEvent) => {
    const pressedKey = event.key

    switch (pressedKey) {
      case 'ArrowUp':
        noteId.value = note.value.index() - 1
        resetCursor()
        drawScore()
        return
      case 'ArrowDown':
        noteId.value = note.value.index() + 1
        resetCursor()
        drawScore()
        return
      case 'ArrowRight':
        elementId.value = element.value.index() + 1
        resetCursor()
        drawScore()
        return
      case 'ArrowLeft':
        elementId.value = element.value.index() - 1
        resetCursor()
        drawScore()
        event.preventDefault()
        return
      case 'Backspace':
        pressedNumbers = pressedNumbers.slice(0, -1)
        note.value!.fretNumber = parseInt(pressedNumbers)
        return
      case 'Insert':
        voice.value.addElement(elementId.value)
        return
      case 'Delete':
        console.log('delete')
        if (!note.value!.isRest()) {
          note.value!.fretNumber = NaN
        } else if (note.value!.bar().empty()) {
          // const moveNote = note.value!.move('ArrowLeft')
          track.value.removeBarAt(bar.value.index())
          barId.value = Math.min(barId.value - 1, 0)
          // note.value = moveNote
          resetCursor()
        } else if (element.value.empty()) {
          voice.value.removeElementAt(element.value.index())
          elementId.value = Math.min(elementId.value, voice.value._elements.length - 1)
        }
        drawScore()
        return
      case ']':
        element.value!.duration /= 2
        return
      case '[':
        element.value!.duration *= 2
        return
      // case 'Insert':
      //   track.value!.addBar(bar.value!.index())
      //   return
      case 'h':
        note.value!.toggleTechnique(Technique.HammerOn)
        return
      case '~':
        note.value!.toggleTechnique(Technique.Vibrato)
        return
      // case 'p':
      //   note.value!.toggleTechnique(Technique.PullOff)
      //   return
      case 'l':
        console.log('left hand')
        return
      case 'r':
        console.log('right hand')
        return

      default:
        if (pressedKey >= '0' && pressedKey <= '9') {
          pressedNumbers += pressedKey
          const value = parseInt(pressedNumbers)
          note.value!.fretNumber = value
          drawScore()
          setTimeout(() => {
            pressedNumbers = ''
          }, 500)
        } else {
          console.log('note: unhandled key:', pressedKey)
        }
    }
  }

  return { noteHandler }
}
