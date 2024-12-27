import { useKeys } from '@/composables/keys/useKeys'
import { useCanvas } from './useCanvas'
import { useCursor } from './useCursor'
import type { Bar } from '@/models/Bar'
import { toRaw } from 'vue'
import { VoiceElement } from '@/models/VoiceElement'

const { drawScore } = useCanvas()
const { track, bar, barId, voice, voiceId, element, elementId, note, noteId, selection, redraw } = useCursor()

let loaded = false

let copySelection: Array<VoiceElement> = []

export const useCommands = () => {
  const { bind } = useKeys()
  if (!loaded) {
    bind('\\d+(.\\d+)?', sequence => {
      console.log('number', sequence)
      note.value.fretNumber = parseInt(sequence)
      drawScore()
    })

    bind('ctrl\\+Delete', () => {
      track.value!.removeBarAt(bar.value!.index())
      drawScore()
    })

    bind('ctrl\\+ArrowUp', () => {
      voiceId.value = Math.min(voice.value.index() + 1, 3)
      drawScore()
    })

    bind('ctrl\\+ArrowDown', () => {
      voiceId.value = Math.max(voice.value.index() - 1, 0)
      drawScore()
    })

    bind('shift\\+ArrowLeft', () => {
      const index = selection.value.indexOf(element.value)

      if (index > -1) {
        selection.value.splice(index, 1)
      }
      elementId.value = element.value.index() - 1

      if (!selection.value.includes(toRaw(element.value))) {
        selection.value.push(toRaw(element.value))
      }
      console.log('selection', selection.value.length)
      drawScore()
    })

    bind('shift\\+ArrowRight', () => {
      elementId.value = element.value.index() + 1
      if (!selection.value.includes(toRaw(element.value))) {
        selection.value.push(toRaw(element.value))
      }
      console.log('selection', selection.value.length)
      drawScore()
    })

    bind('ArrowUp', () => {
      noteId.value = Math.max(note.value.index() - 1, 0)
      drawScore()
    })

    bind('ArrowDown', () => {
      noteId.value = Math.min(note.value.index() + 1, track.value!.stringCount() - 1)
      drawScore()
    })

    bind('ArrowLeft', () => {
      elementId.value = element.value.index() - 1
      selection.value = [toRaw(element.value)]
      drawScore()
    })

    bind('ArrowRight', () => {
      elementId.value = element.value.index() + 1
      selection.value = [toRaw(element.value)]
      drawScore()
    })

    bind('Delete', () => {
      if (isNaN(note.value.fretNumber)) {
        // if (selection.value.length == 1) {
        //   track.value!.removeBarAt(selection[0].bar().index())
        // } else {
        const deleteElements = [...selection.value].reverse()
        const barIndexes = deleteElements.reduce((barIndexes, elem) => {
          if (!barIndexes.includes(elem.bar().index())) {
            barIndexes.push(elem.bar().index())
          }
          return barIndexes
        }, [] as Array<number>)

        while (deleteElements.length > 0) {
          const deleteElement = toRaw(deleteElements.shift())
          deleteElement?.voice().removeElementAt(deleteElement.index())
        }

        let deleteBarCount = 0
        while (barIndexes.length > 0) {
          const barIndex = barIndexes.shift()
          if (track.value._bars[barIndex!]._voices[voiceId.value]._elements.length == 0) {
            console.log('can delete')
            track.value.removeBarAt(barIndex!)
            deleteBarCount += 1
            // noteId.value = 0
          } else {
            console.log("can't delete", track.value._bars[barIndex!]._voices.flatMap(voice => voice._elements).length)
          }
        }

        if (deleteBarCount > 0) {
          barId.value -= deleteBarCount
          elementId.value = 0
        }

        elementId.value -= 1
        elementId.value += 1
        // elementId.value = elementId.value
        selection.value = [toRaw(element.value)]
        console.log('resetting selection', selection.value)
        // }
      } else {
        note.value.fretNumber = NaN
      }
      drawScore()
    })

    bind('Insert', () => {
      // const newElement = new VoiceElement(element.value.voice(), element.value.duration)
      const newElement = element.value.voice().addElement(element.value.index())
      elementId.value -= 1
      elementId.value += 1
      selection.value = [newElement!]
      drawScore()
    })

    bind('\\[', () => {
      element.value.duration.increaseBaseDuration() //  duration *= 2
      drawScore()
    })

    bind('\\.', () => {
      console.log('dotted')
      let dotCount = element.value.duration.dotCount + 1
      if (dotCount == 3) {
        dotCount = 0
      }
      element.value.duration.dotCount = dotCount
      drawScore()
    })

    bind('t', () => {
      console.log('triplet')
      element.value.duration.isTriplet = !element.value.duration.isTriplet
      drawScore()
    })

    bind('\\]', () => {
      element.value.duration.decreaseBaseDuration() // /= 2
      drawScore()
    })

    bind('ctrl\\+s', () => {
      console.log('save')
    })

    bind('ctrl\\+c', () => {
      console.log('copy')
      copySelection = [...selection.value]
    })

    bind('ctrl\\+v', () => {
      console.log('paste')
      if (copySelection.length == 0) {
        return
      }

      const pasteElements = [...copySelection]

      while (pasteElements.length > 0) {
        let pasteElement = toRaw(pasteElements.shift())
        pasteElement = VoiceElement.fromJSON(voice.value, pasteElement?.toJSON())
        voice.value._elements.splice(element.value.index(), 1, pasteElement)
        elementId.value += 1
      }
    })

    bind('ctrl\\+z', () => {
      console.log('undo')
    })

    bind('ctrl\\+shift\\+z', () => {
      console.log('redo')
    })

    loaded = true
  }
}
