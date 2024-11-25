import { Score } from '@/models/Score'
import { computed, type Ref } from 'vue'
import * as d3 from 'd3'
import type { NotePosition } from '@/models/NotePosition'
import { useCursor } from './useCursor'
import { useToast } from 'primevue/usetoast'

export const useKeys = (score: Ref<Score>, drawScore: Function) => {
  const { track, trackId, bar, voiceId, element, note, resetCursor } = useCursor()

  const toast = useToast()

  let keydowns = ''
  let command = null
  let subCommand = null
  let bounceFlag = false

  const applyToActiveNotes = (callback: (element, node, note: NotePosition) => void) => {
    d3.selectAll('g.note.active').each((node, index, nodes) => {
      const note = d3.select(nodes[index]).datum()
      callback(nodes[index], node, note)
    })
    drawScore()
  }

  const selectedTrack = computed(() => {
    return score.value.tracks[trackId.value]
  })

  const handleKeys = (event: KeyboardEvent) => {
    const pressedKey = event.key
    const isCtrlPressed = event.ctrlKey || event.metaKey
    bounceFlag = false

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
      const value = parseInt(keydowns)
      if (command == 'move' && subCommand == 'track') {
        console.log('Moving to track', value - 1)
        if (score.value.tracks.length > value - 1) {
          const newTrack = score.value.tracks[value - 1]
          const barIndex = Math.min(bar.value.index(), newTrack.bars.length - 1)
          newTrack.verify()
          note.value = newTrack.bars[barIndex].voices[0].elements[0].notes[0]
          bounceFlag = true
          setTimeout(() => {
            if (bounceFlag == true) {
              command = null
              subCommand = null
              keydowns = ''
              console.log('clearing move command')
            }
          }, 2000)
        } else {
          toast.add({ severity: 'warn', summary: 'Moving track', detail: 'Cannot move to track ' + value, life: 3000 })
        }
      } else if (command == 'move' && subCommand == 'voice') {
        console.log('Moving to voice', value - 1)
        if (track.value.voiceCount > value - 1) {
          voiceId.value = value - 1
          bounceFlag = true
          command = null
          subCommand = null
          keydowns = ''
          console.log('clearing move command')
        } else {
          toast.add({ severity: 'warn', summary: 'Moving voice', detail: 'Cannot move to voice ' + value, life: 3000 })
        }
      } else if (command == 'move' && subCommand == 'bar') {
        console.log('Moving to bar', value - 1)
        if (track.value.bars.length > value - 1) {
          note.value = track.value.bars[value - 1].voices[0].elements[0].notes[0]
          bounceFlag = true
          setTimeout(() => {
            if (bounceFlag == true) {
              command = null
              subCommand = null
              keydowns = ''
              console.log('clearing move command')
            }
          }, 2000)
        } else {
          toast.add({ severity: 'warn', summary: 'Moving bar', detail: 'Cannot move to bar ' + value, life: 3000 })
        }
      } else {
        note.value.fretNumber = value
      }
      drawScore()
    } else {
      // not numeric
      keydowns = ''
      if (pressedKey == ']') {
        element.value.duration /= 2
      } else if (pressedKey == '[') {
        element.value.duration *= 2
      } else if (pressedKey == 'Enter') {
        keydowns = ''
        command = null
        subCommand = null
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
            resetCursor()
          }
          note.value = nextNote
        }
        drawScore()
      } else if (pressedKey == 'Insert') {
        track.value.addBar(bar.value.index())
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
          } else {
            const nextNode = note.value.next(pressedKey, voiceId.value)
            note.value = nextNode
          }
          drawScore()
          return
        }
      } else if (pressedKey == 'm') {
        command = 'move'
        console.log('activating move command')
      } else if (pressedKey == 't') {
        subCommand = 'track'
        console.log('activating move track command')
      } else if (pressedKey == 'b') {
        subCommand = 'bar'
        console.log('activating move bar command')
      } else if (pressedKey == 'v') {
        subCommand = 'voice'
        console.log('activating move voice command')
      } else {
        console.log('ignoring keypress: ', pressedKey)
      }
    }
  }

  d3.select(window).on('keydown', handleKeys)

  return { handleKeys }
}
