import { MusicalScore } from '@/models/MusicalScore'
import { computed, type Ref } from 'vue'
import * as d3 from 'd3'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import type { NotePosition } from '@/models/NotePosition'
import type { VoiceElement } from '@/models/VoiceElement'
// import { useSettings } from '@/composables/useSettings'
import { useCursor } from './useCursor'

export const useKeys = (score: Ref<MusicalScore>, drawScore: Function) => {
  // const { newScore } = useIndexedDBStore()
  const { voice } = useCursor()

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
      applyToActiveVoiceElements(
        (_, __, voiceElement) => (voiceElement.duration /= 2),
      )
    } else if (pressedKey == '[') {
      applyToActiveVoiceElements(
        (_, __, voiceElement) => (voiceElement.duration *= 2),
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
        selectedTrack.value.bars
          .flatMap(bar =>
            bar.voices.flatMap(voice =>
              voice.elements.flatMap(element => element.notes),
            ),
          )
          .filter(n => n.active).length == 0
      ) {
        debugger
        note.value.next(pressedKey)
        // const selected
        // debugger
        // const firstVoice =
        //   selectedTrack.value.bars[0].voices[currentVoiceId.value - 1]

        // if (!firstVoice) {
        //   debugger
        // }

        // if (firstVoice.elements.length == 0) {
        //   firstVoice.extend()
        // }
        // firstVoice.elements[0].notes[0].active = true

        drawScore()
        return
      }

      applyToActiveNotes((noteElement, _, note) => {
        // const node = d3.select(noteElement);
        // const note = node.datum();
        note.active = false
        let condition = null // note.location;
        const { e: x1, f: y1 } = noteElement.getScreenCTM()

        if (pressedKey == 'ArrowUp') {
          condition = (x1: number, x2: number, y1: number, y2: number) =>
            y2 < y1
        } else if (pressedKey == 'ArrowDown') {
          condition = (x1: number, x2: number, y1: number, y2: number) =>
            y2 > y1
        } else if (pressedKey == 'ArrowRight') {
          if (
            note._voiceElement.isLast() &&
            !note._voiceElement._voice.isComplete()
          ) {
            note._voiceElement._voice.extend()
            drawScore()
            // the new element is likely to get selected below
          }

          condition = (x1: number, x2: number, y1: number, y2: number) =>
            x2 > x1
        } else if (pressedKey == 'ArrowLeft') {
          condition = (x1: number, x2: number, y1: number, y2: number) =>
            x2 < x1
        }

        const nextNote = note.moveActive(pressedKey)

        // const minDistance = 999
        // const best = null
        // d3.selectAll('g.note').each((node, index, nodes) => {
        //   const { e: x2, f: y2 } = nodes[index].getScreenCTM()

        //   debugger // Instead of using X and Y coordinates, perhaps we can walk
        //   const node = note.move(pressedKey)
        //   // closest element to the right
        //   // if (
        //   //   condition(x1, x2, y1, y2) &&
        //   //   note._voiceElement.index() == currentVoiceId.value - 1
        //   // ) {
        //   //   const distance = Math.sqrt(
        //   //     Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2),
        //   //   )
        //   //   if (distance < minDistance) {
        //   //     minDistance = distance
        //   //     best = node
        //   //   }
        //   // }
        // })
        // if (best) {
        //   // const bestNote = d3.select(best).datum();
        //   best.active = true
        // } else {
        //   debugger
        // }
      })
    } else {
      console.log('ignoring keypress: ', pressedKey)
    }
  }

  d3.select(window).on('keydown', handleKeys)

  return { handleKeys }
}
