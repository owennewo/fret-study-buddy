import { useKeys } from '@/composables/keys/useKeys'
import { useCanvas } from './useCanvas'
import { useCursor } from './useCursor'
import type { Bar } from '@/models/Bar'
import { toRaw } from 'vue'

const { drawScore } = useCanvas()
const { track, bar, barId, voice, voiceId, element, elementId, note, noteId, selection, redraw } = useCursor()

let loaded = false

let copyBar: Bar | undefined = undefined

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
      note.value.fretNumber = NaN
      drawScore()
    })

    bind('\\[', () => {
      element.value.duration *= 2
      drawScore()
    })

    bind('\\]', () => {
      element.value.duration /= 2
      drawScore()
    })

    bind('ctrl\\+s', () => {
      console.log('save')
    })

    bind('ctrl\\+c', () => {
      console.log('copy')
      copyBar = bar.value!.clone()
    })
    bind('ctrl\\+v', () => {
      console.log('paste')
      if (copyBar == undefined) {
        return
      }
      track.value!.addBar(bar.value!.index(), copyBar.clone())
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
