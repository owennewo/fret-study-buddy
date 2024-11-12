import { MusicalScore } from '@/models/MusicalScore'
import type { Ref } from 'vue'
import * as d3 from 'd3'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'

export const useKeys = (score: Ref<MusicalScore>, drawScore: Function) => {
  const { newScore } = useIndexedDBStore()

  let keydowns = ''
  const applyToActiveNotes = (
    callback: (element, node, note: NotePosition) => void,
  ) => {
    d3.selectAll('g.note.active').each((node, index, nodes) => {
      const note = d3.select(nodes[index]).datum()
      callback(nodes[index], node, note)
    })

    drawScore()
  }

  const handleKeys = (event: KeyboardEvent) => {
    const pressedKey = event.key
    const isCtrlPressed = event.ctrlKey || event.metaKey

    if (pressedKey == 'Delete' && pressedKey == 'n') {
      newScore()
    }
    if (!score.value) return
    const selectedTrack = score.value.tracks[0]

    if (!isNaN(Number(pressedKey))) {
      keydowns += pressedKey
      console.log(`Number key pressed: ${keydowns}`)
      applyToActiveNotes(
        (_, __, note) => (note.fretNumber = parseInt(keydowns)),
      )
    } else if (pressedKey == 'Enter') {
      keydowns = ''
    } else if (pressedKey == 'Backspace') {
      keydowns = keydowns.slice(0, -1)
      applyToActiveNotes(
        (_, __, note) => (note.fretNumber = parseInt(keydowns)),
      )
    } else if (pressedKey == 'Delete') {
      if (isCtrlPressed) {
        applyToActiveNotes((_, __, note) => {
          const currentBar = note._voiceElement._voice._bar
          currentBar._track.removeBarAt(currentBar.barIndex())
        })
      } else {
        applyToActiveNotes((_, __, note) => (note.fretNumber = NaN))
      }
    } else if (pressedKey == 'Insert') {
      applyToActiveNotes((_, __, note) => {
        const currentBar = note._voiceElement._voice._bar
        currentBar._track.addBar(currentBar.barIndex())
      })
    } else if (pressedKey == 'Escape') {
      applyToActiveNotes((_, __, note) => {
        // const node = d3.select(noteElement);
        // const note = node.datum();
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
        selectedTrack.bars
          .flatMap(bar =>
            bar.voices.flatMap(voice =>
              voice.elements.flatMap(element => element.notes),
            ),
          )
          .filter(n => n.active).length == 0
      ) {
        selectedTrack.bars[0].voices[0].elements[0].notes[0].active = true
        drawScore()
        return
      }

      applyToActiveNotes((noteElement, _, note) => {
        // const node = d3.select(noteElement);
        // const note = node.datum();
        note.active = false
        let condition = null // note.location;
        const assessY = null // note.string_index / (numberStrings.value -1);
        const { e: x1, f: y1 } = noteElement.getScreenCTM()

        if (pressedKey == 'ArrowUp') {
          condition = (x1: number, x2: number, y1: number, y2: number) =>
            y2 < y1
        } else if (pressedKey == 'ArrowDown') {
          condition = (x1: number, x2: number, y1: number, y2: number) =>
            y2 > y1
        } else if (pressedKey == 'ArrowRight') {
          condition = (x1: number, x2: number, y1: number, y2: number) =>
            x2 > x1
        } else if (pressedKey == 'ArrowLeft') {
          condition = (x1: number, x2: number, y1: number, y2: number) =>
            x2 < x1
        }

        let minDistance = 999
        let best = null
        d3.selectAll('g.note').each((node, index, nodes) => {
          const { e: x2, f: y2 } = nodes[index].getScreenCTM()
          // closest element to the right
          if (condition(x1, x2, y1, y2)) {
            const distance = Math.sqrt(
              Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2),
            )
            if (distance < minDistance) {
              minDistance = distance
              best = node
            }
          }
        })
        if (best) {
          // const bestNote = d3.select(best).datum();
          best.active = true
        }
      })
    } else {
      console.log('ignoring keypress: ', pressedKey)
    }
  }

  d3.select(window).on('keydown', handleKeys)

  return { handleKeys }
}
