import { Score } from '@/models/Score'
import { computed, type Ref } from 'vue'
import * as d3 from 'd3'
import { useCursor } from './useCursor'
import { useToast } from 'primevue/usetoast'

export const useKeys = (score: Ref<Score>, drawScore: () => void) => {
  const { track, trackId, bar, voiceId, element, note, resetCursor } = useCursor()

  const toast = useToast()

  let keydowns = ''
  let command = ''
  let subCommand = ''
  let bounceFlag = false

  const selectedTrack = computed(() => {
    return score.value.tracks[trackId.value]
  })

  const handleKeys = (event: KeyboardEvent) => {
    const pressedKey = event.key
    const isCtrlPressed = event.ctrlKey || event.metaKey
    bounceFlag = false

    // special keys (work even if no score is loaded)

    if (isCtrlPressed && pressedKey == 'n') {
      score.value = Score.new()
      event.preventDefault()
    }
    if (!score.value || !track.value || !bar.value || !note.value || !element.value || voiceId.value == null) {
      debugger
      return
    }

    // normal keys (require a score to be loaded)

    if (!isNaN(Number(pressedKey))) {
      keydowns += pressedKey
      console.log(`Number key pressed: ${keydowns}`)
      const value = parseInt(keydowns)
      if (command == 'goto' && subCommand == 'track') {
        console.log('Goto to track', value - 1)
        if (score.value.tracks.length > value - 1) {
          const newTrack = score.value.tracks[value - 1]
          const barIndex = Math.min(bar.value.index(), newTrack.bars.length - 1)
          newTrack.verify()
          note.value = newTrack.bars[barIndex].voices[0].elements[0].notes[0]
          bounceFlag = true
          setTimeout(() => {
            if (bounceFlag == true) {
              command = ''
              subCommand = ''
              keydowns = ''
              console.log('clearing goto command')
            }
          }, 2000)
        } else {
          toast.add({ severity: 'warn', summary: 'Moving track', detail: 'Cannot move to track ' + value, life: 3000 })
        }
      } else if (command == 'move' && subCommand == 'bar') {
        console.log('Move to bar', value - 1)
        if (bar.value.index() + 1 == value) {
          console.log('Already on bat', value - 1)
          toast.add({
            severity: 'warn',
            summary: 'Moving bar',
            detail: `Cannot move current bar ${bar.value.index() + 1} to same index ${value}`,
            life: 3000,
          })
        } else if (track.value.bars.length > value - 1) {
          const currentBarIndex = bar.value.index()
          const newBarIndex = value - 1

          // move track
          track.value.bars.splice(newBarIndex, 0, track.value.bars.splice(currentBarIndex, 1)[0])

          command = subCommand = keydowns = ''
          console.log('clearing goto command')
        }
      } else if (command == 'move' && subCommand == 'track') {
        console.log('Move to track', value - 1)
        if (track.value.index() + 1 == value) {
          console.log('Already on track', value - 1)
          toast.add({
            severity: 'warn',
            summary: 'Moving track',
            detail: `Cannot move current track ${track.value.index() + 1} to same index ${value}`,
            life: 3000,
          })
        } else if (score.value.tracks.length > value - 1) {
          const currentTrackIndex = track.value.index()
          const newTrackIndex = value - 1

          // move track
          score.value.tracks.splice(newTrackIndex, 0, score.value.tracks.splice(currentTrackIndex, 1)[0])

          command = subCommand = keydowns = ''
          console.log('clearing goto command')
        } else {
          toast.add({ severity: 'warn', summary: 'Moving track', detail: 'Cannot move to track ' + value, life: 3000 })
        }
      } else if (command == 'goto' && subCommand == 'voice') {
        console.log('Goto to voice', value - 1)
        if (track.value.voiceCount > value - 1) {
          voiceId.value = value - 1
          bounceFlag = true
          command = subCommand = keydowns = ''
          console.log('clearing move command')
        } else {
          toast.add({ severity: 'warn', summary: 'Moving voice', detail: 'Cannot move to voice ' + value, life: 3000 })
        }
      } else if (command == 'goto' && subCommand == 'bar') {
        console.log('Goto to bar', value - 1)
        if (track.value.bars.length > value - 1) {
          note.value = track.value.bars[value - 1].voices[0].elements[0].notes[0]
          bounceFlag = true
          setTimeout(() => {
            if (bounceFlag == true) {
              command = subCommand = keydowns = ''
              console.log('clearing goto command')
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
        command = ''
        subCommand = ''
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
        note.value = null
        drawScore()
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
            const nextNode = note.value.next(pressedKey)
            note.value = nextNode
          }
          drawScore()
          return
        }
      } else if (pressedKey == 'g') {
        command = 'goto'
        console.log('activating goto command')
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
