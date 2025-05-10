import { Container, Graphics, Text, type TextOptions } from 'pixi.js'
import { Technique, type Note } from '@/models/Note'
import { toRaw } from 'vue'
import { type Voice } from '@/models/Voice'
import { type ColourScheme } from './types'
import { useCursor } from '@/composables/useCursor'
import { BaseNoteValue } from '@/models/Duration'

export const useNoteRenderer = (
  voiceColours: string[],
  colours: ColourScheme,
  refs: any // Accept the refs directly from useCursor
) => {
  const { setCursorNote } = useCursor()

  const voiceColour = (voice: Voice) => {
    return voiceColours[voice.index()]
  }

  const drawTechniqueSlide = (note: Note, usableWidth: number, isUp: boolean) => {
    const g = new Graphics()

    // Calculate dimensions based on the available space
    const slideWidth = note.score().fontSize
    const slideHeight = isUp ? -note.score().fontSize / 2 : note.score().fontSize / 2

    // Start position (to the left of the note)
    const startX = -slideWidth / 2
    const startY = isUp ? note.score().fontSize * 3/4 : note.score().fontSize * 1 / 4

    // End position (at the note)
    const endX = 0 //startX + slideWidth //-note.score().fontSize / 4
    const endY = startY + slideHeight

    // Draw the slide line
    g.moveTo(startX, startY)
      .lineTo(endX, endY)
      .stroke({
        color: voiceColour(note.voice()),
        width: 2,
        cap: 'round',  // Rounded line caps
      })

    return g
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

    const endX = 0  + note.score().fontSize / 4
    const endY = -2

    const startX = endX - duration
    const startY = -2

    const centerX = (startX + endX) / 2
    const centerY = -note.score().fontSize / 2

    // Calculate control points for a quadratic Bézier curve that passes through all three points
    // For a curve passing through three points, we need to calculate special control points
    const controlPoint1X = startX + 2/3 * (centerX - startX)
    const controlPoint1Y = startY + 2/3 * (centerY - startY)

    const controlPoint2X = endX + 2/3 * (centerX - endX)
    const controlPoint2Y = endY + 2/3 * (centerY - endY)

    // Draw the curve
    g.moveTo(startX, startY)
    g.bezierCurveTo(
      controlPoint1X, controlPoint1Y, // Control point 1
      controlPoint2X, controlPoint2Y, // Control point 2
      endX, endY                      // End point
    ).stroke({
      color: voiceColour(note.voice()),
      width: 2,
    })



    return g
  }

  const drawNote = (note: Note, usableWidth: number, barHeight: number) => {
    const stringSpacing = barHeight / (note.track().stringCount() - 1)
    // Use currentNote directly from refs
    const isCurrent = toRaw(refs.currentNote.value) === toRaw(note)
    const rectColor = isCurrent ? voiceColour(note.voice()) : colours.secondary
    const textColor = isCurrent ? colours.secondary : voiceColour(note.voice())

    const c = new Container({
      label: `note${note.index()}`,
      x: 0,
      y: stringSpacing * note.index(),
    })
    const g = new Graphics({ zIndex: 10 })

    const t = new Text({
      text: note.isRest() ? '_' : note.fret.toString(),
      zIndex: 20,
      style: {
        fontSize: note.score().fontSize * ((note.element().duration.beats === BaseNoteValue.Grace) ? 0.75 : 1),
        fill: textColor,
      },
    } as TextOptions)

    g.chamferRect(-3, 0, t.width + 6, t.height - 2, 2).fill({ color: rectColor, alpha: 0.9 })

    if (!isNaN(note.fret) || isCurrent) {
      c.addChild(g)
    }
    if (!isNaN(note.fret)) {
      c.addChild(t)
    }

    // Add techniques
    note.techniques.forEach(technique => {
      if (technique == Technique.HammerOn || technique == Technique.PullOff) {
        c.addChild(drawTechniqueHammer(note, usableWidth))
      } else if (technique == Technique.Bend) {
        c.addChild(drawTechniqueBend(note))
      } else if (technique == Technique.SlideUp) {
        c.addChild(drawTechniqueSlide(note, usableWidth, true))
      } else if (technique == Technique.SlideDown) {
        c.addChild(drawTechniqueSlide(note, usableWidth, false))
      }
    })

    // Add onClick event
    c.interactive = true
    c.on('pointerdown', (event) => {
      c['source'] = note
      console.log('Note clicked:', note.index())
      setCursorNote(note)
      event.stopPropagation() // Stop event propagation
      refs.clickEvent.value = event // Use refs.clickEvent directly
    })

    return c
  }

  return {
    drawNote,
    drawTechniqueBend,
    drawTechniqueHammer,
    drawTechniqueSlide,
    voiceColour
  }
}
