import { useKeys } from '@/composables/keys/useKeys'
import { useCursor } from './useCursor'
import { Bar } from '@/models/Bar'
import { toRaw } from 'vue'
import { VoiceElement } from '@/models/VoiceElement'
import NoteDialog from '@/components/NoteDialog.vue'
import { useDialog } from 'primevue'
import { useSound } from './useSound'
import ScoreSelectorDialog from '@/components/ScoreSelectorDialog.vue'
import { useDataStore } from './datastores/useDataStore'
import { Technique } from '@/models/Note'
import { BaseNoteValue } from '@/models/Duration'

// Import useCanvas but don't destructure drawScore since we don't need to call it manually anymore
const { score, track, bar, barId, voice, voiceId, element, elementId, note, noteId, selection } = useCursor()
const { togglePlay } = useSound()
const datastore = useDataStore()
let loaded = false
let copySelection: Array<VoiceElement | Bar> = []

export const useCommands = () => {
  const dialog = useDialog()
  const { bind } = useKeys()

  if (!loaded) {
    bind('^\\d+(.\\d+)?$', sequence => {
      note.value.fret = parseInt(sequence)
    })

    bind('^ctrl\\+Delete$', () => {
      track.value!.removeBarAt(bar.value!.index())
    })

    bind('^ctrl\\+shift\\+ArrowRight$', () => {

      if (selection.value.size == 0) {
        selection.value = new Set([bar.value])
      }
      if ([...selection.value].filter(item => item instanceof Bar).length == 0) {
        selection.value = new Set([toRaw(bar.value)])
      } else {
        barId.value += 1
        selection.value.add(toRaw(bar.value))
      }
      console.log('ctrl shift right')
    })

    bind('^ctrl\\+shift\\+ArrowLeft$', () => {
      if ([...selection.value].filter(item => item instanceof Bar).length == 0) {
        selection.value = new Set([toRaw(bar.value)])
      } else {
        if (selection.value.has(bar.value)) {
          selection.value.delete(bar.value)
        }
        barId.value -= 1
        if (!selection.value.has(bar.value)) {
          selection.value.add(toRaw(bar.value))
        }
      }
      console.log('ctrl shift right')
    })

    bind('^ctrl\\+ArrowUp$', () => {
      voiceId.value = Math.min(voice.value.index() + 1, 3)
    })

    bind('^ctrl\\+ArrowDown$', () => {
      voiceId.value = Math.max(voice.value.index() - 1, 0)
    })

    bind('^ctrl\\+ArrowRight$', () => {
      barId.value += 1
      elementId.value = 0
      selection.value = new Set([toRaw(element.value)])
    })

    bind('^ctrl\\+ArrowLeft$', () => {
      if (elementId.value > 0) {
        elementId.value = 0
      } else {
        barId.value -= 1
        elementId.value = 0
      }
      selection.value = new Set([toRaw(element.value)])
    })

    bind('^shift\\+ArrowLeft$', () => {
      if (selection.value.has(element.value)) {
        selection.value.delete(element.value)
      }
      elementId.value = element.value.index() - 1
      if (!selection.value.has(toRaw(element.value))) {
        selection.value.add(toRaw(element.value))
      }
      console.log('selection', selection.value.size)
    })

    bind('^Home$', () => {
      barId.value = 0
      elementId.value = 0
      selection.value = new Set([toRaw(element.value)])
    })

    bind('^End$', () => {
      barId.value = bar.value.track()._bars.length - 1
      elementId.value = bar.value.voices()[voiceId.value]._elements.length - 1
      selection.value = new Set([toRaw(element.value)])
    })

    bind('^shift\\+ArrowRight$', () => {
      elementId.value = element.value.index() + 1
      if (!selection.value.has(toRaw(element.value))) {
        selection.value.add(toRaw(element.value))
      }
      console.log('selection', selection.value.size)
    })

    bind('^ArrowUp$', () => {
      noteId.value = Math.max(note.value.index() - 1, 0)
    })

    bind('^ArrowDown$', () => {
      noteId.value = Math.min(note.value.index() + 1, track.value!.stringCount() - 1)
    })

    bind('^ArrowLeft$', () => {
      elementId.value = element.value.index() - 1
      selection.value = new Set([toRaw(element.value)])
    })

    bind('^ArrowRight$', () => {
      elementId.value = element.value.index() + 1
      selection.value = new Set([toRaw(element.value)])
    })

    bind('^Delete$', () => {
      if (selection.value.size == 0) {
        // Nothing is selected, do nothing
        return
      }
      if (!isNaN(note.value.fret) && selection.value.size == 1 )
      {
        note.value.fret = NaN
      } else if (selection.value.size > 0) {
        const deleteItems = [...selection.value].reverse()
        let deleteBarCount = 0
        for (const deleteItem of deleteItems) {
          if (deleteItem instanceof Bar) {
            track.value.removeBarAt(deleteItem.index())
            deleteBarCount += 1
          } else if (deleteItem instanceof VoiceElement) {
            deleteItem.voice().removeElementAt(deleteItem.index())
          }
        }
        selection.value = new Set([])
        barId.value -= deleteBarCount
      }
    })

    bind('^Insert$', () => {
      const newElement = element.value.voice().addElement(element.value.index())
      elementId.value -= 1
      elementId.value += 1
      selection.value = new Set([newElement!])
    })

    bind('^ctrl\\+Insert$', () => {
      const bar = track.value.addBar(barId.value)
      barId.value += 1
      barId.value -= 1
      selection.value = new Set([bar])
    })

    bind('^\\[$', () => {
      element.value.duration.increasebeats()
    })

    bind('^\\]$', () => {
      element.value.duration.decreasebeats() // /= 2
    })

    bind('^\\.$', () => {
      console.log('dotted')
      let dotCount = element.value.duration.dotCount + 1
      if (dotCount == 3) {
        dotCount = 0
      }
      element.value.duration.dotCount = dotCount
    })

    bind('^t$', () => {
      console.log('triplet')
      element.value.duration.isTriplet = !element.value.duration.isTriplet
    })
    bind('^b$', () => {
      console.log('bend')
      note.value.toggleTechnique(Technique.Bend)
    })
    bind('^r$', () => {
      console.log('rest')
      note.value.fret = NaN
    })
    bind('^h$', () => {
      console.log('hammer')
      note.value.toggleTechnique(Technique.HammerOn)
    })
    bind('^p$', () => {
      console.log('pull')
      note.value.toggleTechnique(Technique.PullOff)
    })
    bind('^s$', () => {
      console.log('slideDown')
      note.value.toggleTechnique(Technique.SlideDown)
    })
    bind('^g$', () => {
      console.log('grace')
      element.value.duration.beats = element.value.duration.beats == BaseNoteValue.Grace
                                              ? BaseNoteValue.Quarter
                                              : BaseNoteValue.Grace
    })
    bind('^shift\\+S$', () => {
      console.log('slideUp')
      note.value.toggleTechnique(Technique.SlideUp)
    })
    bind('^\\ $', () => {
      togglePlay()
    })

    bind('^i$', () => {
      console.log('info')
      dialog.open(NoteDialog, {
        props: {
          header: 'Edit Score',
          modal: true,
          dismissableMask: true,
        },
      })
    })

    bind('^ctrl\\+o$', () => {
      console.log('open')
      dialog.open(ScoreSelectorDialog, {
        props: {
          header: 'Open Score',
          modal: true,
          dismissableMask: true,
        },
      })
    })

    bind('^ctrl\\+s$', () => {
      datastore.saveLocal(score.value)
    })

    bind('^ctrl\\+c$', () => {
      console.log('copy')
      copySelection = [...selection.value]
    })

    bind('^ctrl\\+v$', () => {
      console.log('paste')
      if (copySelection.length == 0) {
        return
      }
      const pasteItems = [...copySelection]

      while (pasteItems.length > 0) {
        let pasteItem = toRaw(pasteItems.shift())
        if (pasteItem instanceof Bar) {
          pasteItem = pasteItem.clone()
          track.value._bars.splice(bar.value.index(), 1, pasteItem)
          barId.value += 1
        } else if (pasteItem instanceof VoiceElement) {
          pasteItem = VoiceElement.fromJSON(voice.value, pasteItem?.toJSON())
          voice.value._elements.splice(element.value.index(), 1, pasteItem)
          elementId.value += 1
          console.debug("paste", element.value.bar().index(), element.value.index())
        } else {
          // what are they pasting
          debugger
        }
      }
    })

    bind('^ctrl\\+z$', () => {
      console.log('undo')
    })

    bind('^ctrl\\+shift\\+z$', () => {
      console.log('redo')
    })

    // --- Custom: Bind 'l' followed by digits to link(barIndex) with debounce ---
    let linkSequence = ''
    let linkTimeout: ReturnType<typeof setTimeout> | null = null
    bind('^l$', () => {
      linkSequence = ''
      if (linkTimeout) clearTimeout(linkTimeout)
      // Start listening for digits
      const digitHandler = (e: KeyboardEvent) => {
        if (/\d/.test(e.key)) {
          linkSequence += e.key
          if (linkTimeout) clearTimeout(linkTimeout)
          linkTimeout = setTimeout(() => {
            if (linkSequence.length > 0 && bar.value && typeof bar.value.link === 'function') {
              bar.value.link(parseInt(linkSequence, 10) - 1)
            }
            linkSequence = ''
            window.removeEventListener('keydown', digitHandler)
            selection.value = new Set([toRaw(bar.value)])
          }, 500)
        } else {
          // Stop listening if a non-digit is pressed
          if (linkTimeout) clearTimeout(linkTimeout)
          linkSequence = ''
          window.removeEventListener('keydown', digitHandler)
        }
      }
      window.addEventListener('keydown', digitHandler)
    })

    // --- Custom: Bind 'u' to unlink the current bar ---
    bind('^u$', () => {
      if (bar.value && typeof bar.value.unlink === 'function') {
        bar.value.unlink()
        selection.value = new Set([toRaw(bar.value)])
      }
    })

    loaded = true
  }
}
