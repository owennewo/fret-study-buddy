import { Container, Text, TextStyle, type TextOptions } from 'pixi.js'
import { VoiceElement } from '@/models/VoiceElement'
import { BaseNoteValue, Duration } from '@/models/Duration'
import { useNoteRenderer } from './useNoteRenderer'
import { type ColourScheme, type RendererRefs } from './types'

export const useElementRenderer = (
  voiceColours: string[],
  colours: ColourScheme,
  refs: Pick<RendererRefs, 'currentNote' | 'clickEvent'>
) => {
  const { drawNote } = useNoteRenderer(voiceColours, colours, refs)

  const drawElement = (element: VoiceElement, usableWidth: number, barHeight: number) => {
    const c = new Container({ label: `element${element.index()}` })

    // Position the element based on its location in the bar
    let xPosition = (usableWidth * element.location()) /
      Math.max(element.voice().duration(), element.bar().timeSignature.beatsPerBar) +
      element.score().fontSize / 2

    // Move Grace notes to the left by fontSize
    if (element.duration.beats === BaseNoteValue.Grace) {
      xPosition -= element.score().fontSize
    }

    c.x = xPosition
    c.y = -element.score().fontSize / 2

    // Handle invalid duration (defensive programming)
    if (
      element.beatDuration() > 10 ||
      element.beatDuration() < -10 ||
      element.beatDuration() == null ||
      element.beatDuration() == undefined
    ) {
      console.warn('##### Invalid duration', element)
      // Set to a sensible default instead of using debugger
      element.duration = new Duration(BaseNoteValue.Quarter)
    }

    // Add element name if it exists
    if (element.name) {
      const textStyle = new TextStyle({
        fontSize: element.score().fontSize,
        fill: colours.primary,
      })

      const t = new Text({
        text: element.name,
        style: textStyle,
        x: 0,
        y: -1 * element.score().fontSize,
      } as TextOptions)

      c.addChild(t)
    }

    // Draw all notes in this element
    element._notes.forEach(note => {
      c.addChild(drawNote(note, usableWidth, barHeight))
    })

    return c
  }

  return { drawElement }
}
