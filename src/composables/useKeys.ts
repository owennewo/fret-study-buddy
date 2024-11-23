import { Score } from '@/models/Score'
import { computed, type Ref } from 'vue'
import * as d3 from 'd3'
import type { NotePosition } from '@/models/NotePosition'
import { useCursor } from './useCursor'

export const useKeys = (score: Ref<Score>, drawScore: Function) => {
  const { track, bar, voiceId, element, note, resetCursor } = useCursor()

  let keydowns = ''
  const applyToActiveNotes = (callback: (element, node, note: NotePosition) => void) => {
    d3.selectAll('g.note.active').each((node, index, nodes) => {
      const note = d3.select(nodes[index]).datum()
      callback(nodes[index], node, note)
    })
    drawScore()
  }

  const selectedTrack = computed(() => {
    return score.value.tracks[0]
  })

  const handleKeys = (event: KeyboardEvent) => {
    const pressedKey = event.key
    const isCtrlPressed = event.ctrlKey || event.metaKey

    // special keys (work even if no score is loaded)

    if (isCtrlPressed && pressedKey == 'n') {
      newScore()
      event.preventDefault()
    }
    if (!score.value) return

    // normal keys (require a score to be loaded)

    if (!isNaN(Number(pressedKey))) {
      keydowns += pressedKey
      console.log(`Number key pressed: ${keydowns}`)
      note.value.fretNumber = parseInt(keydowns)
      drawScore()
    } else if (pressedKey == ']') {
      element.value.duration /= 2
    } else if (pressedKey == '[') {
      element.value.duration *= 2
    } else if (pressedKey == 'Enter') {
      keydowns = ''
    } else if (pressedKey == 'Backspace') {
      keydowns = keydowns.slice(0, -1)
      note.value.fretNumber = parseInt(keydowns)
    } else if (pressedKey == 'Delete') {
      if (!note.value.isRest()) {
        note.value.fretNumber = NaN
      } else if (note.value._element.empty()) {
        let nextNote = note.value.next('ArrowLeft')
        note.value._element._voice.removeElementAt(note.value._element.index())
        if (note.value._element._voice.elements.length == 0) {
          nextNote = nextNote.next('ArrowLeft')
          note.value._element._voice._bar._track.removeBarAt(note.value._element._voice._bar.index())
        }
        note.value = nextNote
      }
      drawScore()
    } else if (pressedKey == 'Insert') {
      track.value.addBar(bar.value.index())
      // })
    } else if (pressedKey == 'Escape') {
      applyToActiveNotes((_, __, note) => {
        note.active = false
      })
    } else if (
      pressedKey == 'ArrowUp' ||
      pressedKey == 'ArrowDown' ||
      pressedKey == 'ArrowRight' ||
      pressedKey == 'ArrowLeft'
    ) {
      event.preventDefault()
      keydowns = ''
      if (
        selectedTrack.value.bars
          .flatMap(bar => bar.voices.flatMap(voice => voice.elements.flatMap(element => element.notes)))
          .filter(n => n.active).length == 0
      ) {
        if (note.value == null) {
          resetCursor()
          // debugger
        } else {
          const nextNode = note.value.next(pressedKey, voiceId.value)
          note.value = nextNode
        }
        drawScore()
        return
      }
    } else {
      console.log('ignoring keypress: ', pressedKey)
    }
  }

  d3.select(window).on('keydown', handleKeys)

  return { handleKeys }
}
