import { Container, Graphics, Text, type TextOptions } from 'pixi.js'
import { Technique, type Note } from '@/models/Note'
import { toRaw } from 'vue'
import { type Voice } from '@/models/Voice'
import { type ColourScheme, type RendererRefs } from './types'
import { useCursor } from '@/composables/useCursor'
export const useNoteRenderer = (
  voiceColours: string[],
  colours: ColourScheme,
  refs: Pick<RendererRefs, 'currentNote' | 'clickEvent'>
) => {

  const { setCursorNote } = useCursor()
  const voiceColour = (voice: Voice) => {
    return voiceColours[voice.index()]
  }


  const drawTechniqueBend = (note: Note) => {
    const g = new Graphics()

    // Adjust these to taste
    const bendWidth = note.score().fontSize * 1.5
    const bendHeight = note.score().fontSize * 1.2
    const arrowSize = 6

    // Start at the note position
    const startX = note.score().fontSize / 2
    const startY = 0

    // Where the curved portion ends
    const curveEndX = bendWidth
    const curveEndY = -bendHeight

    // Begin drawing
    g.moveTo(startX, startY)
    g.bezierCurveTo(
      curveEndX, -bendHeight * 0.2,    // control point 1
      curveEndX, -bendHeight * 0.5, // control point 2
      curveEndX, curveEndY
    ).stroke({ width: 2, color: voiceColour(note.voice()) })

    // Draw arrow at the top
    g.moveTo(curveEndX, curveEndY)
    // Left slash
    g.lineTo(curveEndX - arrowSize, curveEndY + arrowSize)
    // Move back to top
    g.moveTo(curveEndX, curveEndY)
    // Right slash
    g.lineTo(curveEndX + arrowSize, curveEndY + arrowSize)
    g.lineTo(curveEndX - arrowSize, curveEndY + arrowSize)
      .stroke({ width: 2, color: voiceColour(note.voice()) })
      .fill(voiceColour(note.voice()))

    return g
  }

  const drawTechniqueHammer = (note: Note, usableWidth: number) => {
    const g = new Graphics()
    const duration = note.element().prev().beatDuration() * usableWidth / note.bar().timeSignature.beatsPerBar
    const radiusX = (duration - note.score().fontSize) / 2 // Horizontal radius (semi-width)
    const radiusY = note.score().fontSize / 2 // Fixed vertical radius (height)
    const centerX = -radiusX - note.score().fontSize / 4
    const centerY = 0

    g.moveTo(centerX - radiusX, centerY)

    // Use bezierCurveTo to create a semi-ellipse
    g.bezierCurveTo(
      centerX - radiusX, centerY - radiusY, // Control point 1
      centerX + radiusX, centerY - radiusY, // Control point 2
      centerX + radiusX, centerY            // End point
    ).stroke({
      color: voiceColour(note.voice()),
      width: 2,
    })

    return g
  }

  const drawNote = (note: Note, usableWidth: number, barHeight: number) => {
    const stringSpacing = barHeight / (note.track().stringCount() - 1)
    const isCurrent = toRaw(refs.currentNote.value) === toRaw(note)
    console.log('Drawing note:', { noteIndex: note.index(), isCurrent }) // Add logging
    const rectColor = isCurrent ? voiceColour(note.voice()) : colours.secondary
    const textColor = isCurrent ? colours.secondary : voiceColour(note.voice())

    const c = new Container({
      label: `note${note.index()}`,
      x: 0,
      y: stringSpacing * note.index(),
    })
    const g = new Graphics({ zIndex: 10 })

    const t = new Text({
      text: note.isRest() ? '_' : note.fretNumber.toString(),
      zIndex: 20,
      style: {
        fontSize: note.score().fontSize,
        fill: textColor,
      },
    } as TextOptions)

    g.chamferRect(-3, 0, t.width + 6, t.height - 2, 2).fill({ color: rectColor, alpha: 0.9 })

    if (!isNaN(note.fretNumber) || isCurrent) {
      c.addChild(g)
    }
    if (!isNaN(note.fretNumber)) {
      c.addChild(t)
    }

    // Add techniques
    note.techniques.forEach(technique => {
      if (technique == Technique.HammerOn || technique == Technique.PullOff) {
        c.addChild(drawTechniqueHammer(note, usableWidth))
      } else if (technique == Technique.Bend) {
        c.addChild(drawTechniqueBend(note))
      }
    })

    // Add onClick event
    c.interactive = true
    c.on('pointerdown', (event) => {
      c['source'] = note
      console.log('Note clicked11', note.index())
      setCursorNote(note)
      event.stopPropagation() // Stop event propagation
      refs.clickEvent.value = event
    })

    return c
  }

  return { drawNote, drawTechniqueBend, drawTechniqueHammer, voiceColour }
}
