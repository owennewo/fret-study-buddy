import { MusicalScore } from '@/models/MusicalScore'
import { computed, type Ref } from 'vue'
import * as d3 from 'd3'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import type { NotePosition } from '@/models/NotePosition'
import type { VoiceElement } from '@/models/VoiceElement'
// import { useSettings } from '@/composables/useSettings'
import { useCursor } from './useCursor'

export const useKeys = (score: Ref<MusicalScore>, drawScore: Function) => {
  const { track, bar, voice, element, note, resetCursor } = useCursor()

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

  const selectedTrack = computed(() => {
    return score.value.tracks[0]
  })

  // const selectedBar = computed(()=> {
  //   return score.value.tracks[0]
  // })

  // const selectedVoice = computed(()=> {
  //   return selectedTrack.value.voices[currentVoiceId.value]
  // })

  const applyToActiveVoiceElements = (
    callback: (element, node, voiceElement: VoiceElement) => void,
  ) => {
    const uniqueParents = new Set()

    // Select all active note nodes
    d3.selectAll('g.note.active').each((node, index, nodes) => {
      const parent = nodes[index].parentNode

      // If the parent hasn't been processed yet, add to the set and call callback
      if (!uniqueParents.has(parent)) {
        uniqueParents.add(parent)
        const parentDatum = d3.select(parent).datum() // Get data bound to the parent
        callback(parent, node, parentDatum) // Call callback with the parent element
      }
    })

    drawScore()
  }

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
      applyToActiveNotes(
        (_, __, note) => (note.fretNumber = parseInt(keydowns)),
      )
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
      if (isCtrlPressed) {
        track.value.removeBarAt(bar.value.index())
      } else {
        note.value.fretNumber = NaN
      }
    } else if (pressedKey == 'Insert') {
      // applyToActiveNotes((_, __, note) => {
      // const currentBar = note._voiceElement._voice._bar
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
          .flatMap(bar =>
            bar.voices.flatMap(voice =>
              voice.elements.flatMap(element => element.notes),
            ),
          )
          .filter(n => n.active).length == 0
      ) {
        if (note.value == null) {
          resetCursor()
        } else {
          const nextNode = note.value.next(pressedKey)
          note.value = nextNode
        }

        drawScore()
        return
      }

      // applyToActiveNotes((noteElement, _, note) => {
      //   note.active = false
      //   let condition = null // note.location;
      //   const { e: x1, f: y1 } = noteElement.getScreenCTM()

      //   if (pressedKey == 'ArrowUp') {
      //     condition = (x1: number, x2: number, y1: number, y2: number) =>
      //       y2 < y1
      //   } else if (pressedKey == 'ArrowDown') {
      //     condition = (x1: number, x2: number, y1: number, y2: number) =>
      //       y2 > y1
      //   } else if (pressedKey == 'ArrowRight') {
      //     if (
      //       note._voiceElement.isLast() &&
      //       !note._voiceElement._voice.isComplete()
      //     ) {
      //       note._voiceElement._voice.extend()
      //       drawScore()
      //       // the new element is likely to get selected below
      //     }

      //     condition = (x1: number, x2: number, y1: number, y2: number) =>
      //       x2 > x1
      //   } else if (pressedKey == 'ArrowLeft') {
      //     condition = (x1: number, x2: number, y1: number, y2: number) =>
      //       x2 < x1
      //   }

      //   const nextNote = note.moveActive(pressedKey)

      // })
    } else {
      console.log('ignoring keypress: ', pressedKey)
    }
  }

  d3.select(window).on('keydown', handleKeys)

  return { handleKeys }
}
