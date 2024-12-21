import { Technique } from '@/models/NotePosition'
import { useCursor } from '../useCursor'
import { useCanvas } from '../useCanvas'
import { nextTick } from 'vue'

const { track, bar, barId, voice, voiceId, element, elementId, note, noteId, redraw } = useCursor()
const { drawScore } = useCanvas()

export const useNoteKeys = () => {
  let pressedNumbers = ''
  const noteHandler = (event: KeyboardEvent) => {
    const pressedKey = event.key

    switch (pressedKey) {
      case 'ArrowUp':
        noteId.value = Math.max(note.value.index() - 1, 0)
        drawScore()
        return
      case 'ArrowDown':
        noteId.value = Math.min(note.value.index() + 1, track.value!.stringCount() - 1)
        drawScore()
        return
      case 'ArrowRight':
        console.log('arrow right')
        elementId.value = element.value.index() + 1
        nextTick(() => {
          drawScore()
        })
        return
      case 'ArrowLeft':
        elementId.value = element.value.index() - 1
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
