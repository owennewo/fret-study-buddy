import { computed, ref, toRaw, type Ref } from 'vue'
import { VoiceElement } from '@/models/VoiceElement'

import { useCursor } from '@/composables/useCursor'
import type { Bar } from '@/models/Bar'
import type { Track } from '@/models/Track'
import type { Voice } from '@/models/Voice'
import { Technique, type Note } from '@/models/Note'
import { Application, Container, Graphics, Text, TextStyle, type TextOptions } from 'pixi.js'

import { initDevtools } from '@pixi/devtools'
import { BaseNoteValue, Duration } from '@/models/Duration'
import { useFretboard } from './useFretboard'
const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)
const canvasContainerRef: Ref<HTMLDivElement | null> = ref(null)

const { drawFretboard } = useFretboard()

let pixi: Application | null = null

export const useCanvas = () => {
  const backgroundColour = 'lightgrey'

  const voiceColours = ['#8e0000', '#4a0072', '#0000b2', '#004d40']

  const colours = computed(() => {
    return isDarkMode.value
      ? {
        primary: 'white',
        secondary: 'black',
      }
      : {
        primary: 'black',
        secondary: 'white',
      }
  })

  // const foregroundColour2 = '#d0d3d4'
  const pageContainer = new Container({ label: 'page' })

  if (import.meta.hot) {
    const registered = import.meta.hot.data.registered || false;
    if (!registered) {
      import.meta.hot.data.registered = true;
      import.meta.hot.accept(() => {
        console.log('HOT RELOAD!');
        drawScore();
      });
    }
  }

  const {
    score,
    note: currentNote,
    element: currentElement,
    bar: currentBar,
    track: currentTrack,
    selection,
    voiceId,
    isDarkMode,
  } = useCursor()

  const voiceColor = (voice: Voice) => {
    return voiceColours[voice.index()]
  }

  const drawTechniqueBend = (note: Note, usableWidth: number) => {
    const g = new Graphics();

    // Adjust these to taste
    // const duration = note.element().prev().beatDuration() * usableWidth / note.bar().timeSignature.beatsPerBar;
    const bendWidth = score.value.fontSize * 1.5;
    const bendHeight = score.value.fontSize * 1.2;
    const arrowSize = 6;

    // Start at the note position
    const startX = score.value.fontSize / 2;
    const startY = 0;

    // Where the curved portion ends (just before going vertical)
    // We'll do a gentle curve up to about 80% of bendHeight
    const curveEndX = bendWidth; // * 0.8;
    const curveEndY = -bendHeight; // * 0.8;

    // The final vertical portion
    const endX = bendWidth;
    const endY = -bendHeight;

    // Begin drawing
    // 1) A slight upward curve
    g.moveTo(startX, startY);
    g.bezierCurveTo(
      curveEndX, -bendHeight * 0.2,    // control point 1
      curveEndX, -bendHeight * 0.5, // control point 2
      curveEndX, curveEndY
    ).stroke({ width: 2, color: voiceColor(note.voice()) });

    // 3) Draw an upward arrow at the very top
    // Move from the top of the bend...
    g.moveTo(endX, endY);
    // ...left slash
    g.lineTo(endX - arrowSize, endY + arrowSize);
    // Move back to top
    g.moveTo(endX, endY);
    // ...right slash
    g.lineTo(endX + arrowSize, endY + arrowSize)
    g.lineTo(endX - arrowSize, endY + arrowSize)
      .stroke({ width: 2, color: voiceColor(note.voice()) })
      .fill(voiceColor(note.voice()));

    return g;
  };


  const drawTechniqueHammer = (note: Note, usableWidth: number) => {

    const g = new Graphics();
    const duration = note.element().prev().beatDuration() * usableWidth / note.bar().timeSignature.beatsPerBar;
    const radiusX = (duration - score.value.fontSize) / 2; // Horizontal radius (semi-width)
    const radiusY = score.value.fontSize / 2; // Fixed vertical radius (height)
    const centerX = -radiusX - score.value.fontSize / 4;
    const centerY = 0;

    g.moveTo(centerX - radiusX, centerY);

    // Use bezierCurveTo to create a semi-ellipse
    g.bezierCurveTo(
      centerX - radiusX, centerY - radiusY, // Control point 1
      centerX + radiusX, centerY - radiusY, // Control point 2
      centerX + radiusX, centerY            // End point
    ).stroke({
      color: voiceColor(note.voice()),
      width: 2,
    });

    return g
  }

  const drawNote = (note: Note, usableWidth: number, barHeight: number) => {
    const stringSpacing = barHeight / (note.track().stringCount() - 1)
    const isCurrent = toRaw(currentNote.value) === toRaw(note)
    const rectColor = isCurrent ? voiceColor(note.voice()) : colours.value.secondary
    if (note.fretNumber == 4) {
      // debugger
    }
    const textColor = isCurrent ? colours.value.secondary : voiceColor(note.voice())

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

    note.techniques.forEach(technique => {
      if (technique == Technique.HammerOn || technique == Technique.PullOff) {
        c.addChild(drawTechniqueHammer(note, usableWidth))
      } else if (technique == Technique.Bend) {
        c.addChild(drawTechniqueBend(note, usableWidth))
      }

    });
    return c
  }

  const drawElement = (element: VoiceElement, usableWidth: number, barHeight: number) => {
    const c = new Container({ label: `element${element.index()}` })

    c.x =
      (usableWidth * element.location()) /
      Math.max(element.voice().duration(), element.bar().timeSignature.beatsPerBar) +
      element.score().fontSize / 2
    c.y = -element.score().fontSize / 2

    if (element.voice().index() == voiceId.value) {
      if (
        element.beatDuration() > 10 ||
        element.beatDuration() < -10 ||
        element.beatDuration() == null ||
        element.beatDuration() == undefined
      ) {
        console.log('##### Invalid duration', element)
        debugger
        element.duration = new Duration(BaseNoteValue.Quarter)
      }

      if (element.name) {
        const textStyle = new TextStyle({
          fontSize: element.score().fontSize,
          fill: colours.value.primary, // Text color
        })

        // Create the text
        const t = new Text({
          text: element.name,
          style: textStyle,
          x: 0,
          y: -1 * element.score().fontSize,
        } as TextOptions)

        c.addChild(t)
      }
    }

    element._notes.forEach(note => {
      c.addChild(drawNote(note, usableWidth, barHeight))
    })
    return c
  }

  const drawVoice = (voice: Voice, usableWidth: number, barHeight: number) => {
    const c = new Container({ label: `voice${voice.index()}` })

    if (voice.index() == voiceId.value) {
      const g = new Graphics()
      const selectionDimension = voice._elements.reduce(
        (acc, element) => {
          if (selection.value.includes(toRaw(element))) {
            return [
              Math.min(isNaN(acc[0]) ? element.location() : acc[0], element.location()),
              Math.max(
                isNaN(acc[1]) ? element.location() + element.beatDuration() : acc[1],
                element.location() + element.beatDuration(),
              ),
              Math.min(isNaN(acc[2]) ? 0 : acc[2], 0),
              Math.max(
                isNaN(acc[3]) ? currentTrack.value.stringCount() - 1 : acc[3],
                currentTrack.value.stringCount() - 1,
              ),
            ]
          }
          return acc
        },
        [NaN, NaN, NaN, NaN],
      )

      const voiceDuration = Math.max(voice.bar().timeSignature.beatsPerBar, voice.duration())
      if (!isNaN(selectionDimension[0])) {
        g.rect(
          (selectionDimension[0] / voiceDuration) * usableWidth, // - voice.score().fontSize / 2,
          0,
          ((selectionDimension[1] - selectionDimension[0]) / voiceDuration) * usableWidth,
          barHeight,
        ).fill({ color: voiceColours[voice.index()], alpha: 0.5 })
      }
      c.addChild(g)
    }

    voice._elements.forEach(element => {
      c.addChild(drawElement(element, usableWidth, barHeight))
    })
    return c
  }

  const drawBar = (bar: Bar, barWidth: number, barHeight: number, trackHeight: number): Container => {
    const x = barWidth * (bar.index() % score.value.barsPerLine)
    const y = trackHeight * Math.floor(bar.index() / score.value.barsPerLine)

    const padding = bar.score().fontSize
    const usableWidth = barWidth - padding * 2

    const c = new Container({
      label: `bar${bar.index()}`,
      x: x,
      y: y,
    }).on('pointerdown', c => {
      console.log('Bar clicked', bar.index())
    })
    c.interactive = true

    const c2 = new Container({
      label: `inner${bar.index()}`,
      x: padding,
      y: 0,
    }).on('pointerdown', c => {
      console.log('Bar clicked', bar.index())
    })

    const stringSpacing = barHeight / (bar.track().stringCount() - 1)

    const g = new Graphics()
    const g2 = new Graphics()

    for (let i = 0; i < bar.track().stringCount(); i++) {
      const lineY = i * stringSpacing
      g.moveTo(0, lineY).lineTo(barWidth, lineY).stroke({ width: 1, color: colours.value.primary })
    }

    // Draw vertical start and end bars
    g.moveTo(0, 0)
      .lineTo(0, barHeight + 1)
      .moveTo(barWidth, 0)
      .stroke({ width: bar.index() == 0 ? 4 : 1, color: colours.value.primary })
      .lineTo(barWidth, barHeight + 1) // End bar
      .stroke({ width: bar.index() == bar.track()._bars.length - 1 ? 4 : 1, color: colours.value.primary })

    if (selection.value.includes(bar)) {
      console.log('BAR selected', bar.index())
      g.rect(
        0, // - voice.score().fontSize / 2,
        0,
        barWidth,
        barHeight,
      ).fill({ color: 'red', alpha: 0.25 })
    }

    const textStyle = new TextStyle({
      fontSize: bar.score().fontSize,
      fill: colours.value.primary, // Text color
    })

    // Create the text
    const t = new Text({
      text: bar.index() + 1,
      style: textStyle,
      x: 0,
      y: -1.5 * bar.score().fontSize,
    } as TextOptions)

    for (let i = 0; i < bar.timeSignature.beatsPerBar; i++) {
      const x = (usableWidth * i) / bar.timeSignature.beatsPerBar
      g2.moveTo(x, barHeight).lineTo(x, barHeight + 1.5 * score.value.fontSize)
      g2.stroke({ width: 3, alpha: 0.25 })
    }
    bar._voices[voiceId.value]._elements.forEach(element => {
      if (element.location() - Math.floor(element.location()) > 0.1) {
        const x = (usableWidth * element.location()) / bar.timeSignature.beatsPerBar
        g2.moveTo(x, barHeight).lineTo(x, barHeight + 1.5 * element.beatDuration() * score.value.fontSize)
        g2.stroke({ width: 2, alpha: 0.25 })
      }
    })

    c.addChild(g)
    c.addChild(t)
    c.addChild(c2)
    c2.addChild(g2)

    bar._voices.forEach(voice => {
      c2.addChild(drawVoice(voice, usableWidth, barHeight))
    })
    return c
  }

  const drawTrack = (track: Track, width: number): Container => {
    const barPadding = score.value.fontSize * 2

    const trackContainer = new Container({ label: `track${track.index()}` })

    const barWidth = width / score.value.barsPerLine
    const numberOfTracks = track.score()._tracks.length
    const totalStrings = score.value._tracks.reduce((acc, track) => acc + track.stringCount(), 0)
    const trackHeight = score.value.fontSize * (totalStrings - numberOfTracks) + 2 * barPadding * numberOfTracks
    const barHeight = score.value.fontSize * (totalStrings - numberOfTracks)
    track._bars.forEach(bar => {
      const barContainer = drawBar(bar, barWidth, barHeight, trackHeight)

      trackContainer.addChild(barContainer)
      if (toRaw(currentBar.value) === toRaw(bar)) {
        // Get the canvas DOM element from the ref
        const canvasElement = canvasRef.value

        // Get the scrollable parent element (the parent div of the canvas)
        const scrollableElement = canvasElement!.parentElement

        // Ensure we have a valid parent element
        if (scrollableElement) {
          const barTopDiff = barContainer.getGlobalPosition().y - scrollableElement.scrollTop
          const barBottomDiff =
            barContainer.getGlobalPosition().y +
            barContainer.getBounds().height -
            (scrollableElement.scrollTop + scrollableElement.getBoundingClientRect().height)

          if (barTopDiff < 0) {
            // can't see top of bar
            console.log('top needs move of ', barTopDiff)
            scrollableElement.scrollTop += barTopDiff
          } else if (barBottomDiff > 0) {
            // can't see bottom of bar
            console.log('bottom needs move of ', barBottomDiff)
            scrollableElement.scrollTop += barTopDiff
          } else {
            // console.log('move not needed')
          }
        }
      }
    })

    return trackContainer
  }

  const setupPixi = async () => {
    const app = new Application()

    const wrapper = document.getElementById('canvas-wrapper')!
    let first = true
    const resizeObserver = new ResizeObserver(() => {
      if (first) {
        first = false
      } else {
        console.log("canvas resize detected")
        drawScore()
      }
    })
    resizeObserver.observe(wrapper)
    await app.init({
      canvas: canvasRef.value!,
      backgroundColor: backgroundColour,
    })
    initDevtools(app)
    return app;
  }

  const drawScore = async () => {
    // drawFretboard()
    // return
    if (!score.value) {
      console.log('No score found')
      return
    }
    if (selection.value.length == 0) {
      selection.value = [toRaw(currentElement.value)]
    }
    if (pixi == null) {
      pixi = await setupPixi()
    }

    const verticalGap = 30 + score.value.fontSize * 2
    const horizontalGap = 20

    pageContainer.removeChildren()
    pixi.stage.removeChildren()

    const scoreContainer = new Container({ label: 'score' })
    const wrapper = document.getElementById('canvas-wrapper')!
    const canvasWidth = wrapper.clientWidth

    score.value!._tracks.forEach(track => {
      const usableWidth = canvasWidth - 2 * horizontalGap
      scoreContainer.addChild(drawTrack(track, usableWidth))
    })

    scoreContainer.y = verticalGap
    scoreContainer.x = horizontalGap

    pageContainer.addChild(scoreContainer)

    if (pixi.renderer) {
      pixi!.renderer.background.color = colours.value.secondary
      pixi!.renderer.resize(
        wrapper.clientWidth,
        Math.floor(Math.max(scoreContainer.height + verticalGap, wrapper.clientHeight)) - 1,
      )
    } else {
      console.warn(' RESIZE FAILED', pixi, pixi?.renderer)
    }
    pixi.stage.addChild(pageContainer)
  }

  return { drawScore, canvasRef, canvasContainerRef, voiceColours }
}
