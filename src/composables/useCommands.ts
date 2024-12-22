import { useKeys } from '@/composables/keys/useKeys'
import { useCanvas } from './useCanvas'
import { useCursor } from './useCursor'

const { drawScore } = useCanvas()
const { track, bar, barId, voice, voiceId, element, elementId, note, noteId, redraw } = useCursor()

let loaded = false

let copyBar: Bar = undefined

export const useCommands = () => {
  const { bind } = useKeys()
  if (!loaded) {
    bind('\\d+(.\\d+)?', sequence => {
      // voiceId.value = Math.min(voice.value.index() + 1, 3)
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
      drawScore()
    })

    bind('ArrowRight', () => {
      elementId.value = element.value.index() + 1
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
