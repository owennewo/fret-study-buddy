import { ref, toRaw, type Ref } from 'vue'
import { TailType, VoiceElement } from '@/models/VoiceElement'

import { useCursor } from '@/composables/useCursor'
import type { Bar } from '@/models/Bar'
import type { Track } from '@/models/Track'
import type { Voice } from '@/models/Voice'
import type { Note } from '@/models/Note'
import { Application, Container, Graphics, Text, TextStyle, type TextOptions } from 'pixi.js'
import { initDevtools } from '@pixi/devtools'
import { Duration } from '@/models/Duration'
const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)
const canvasContainerRef: Ref<HTMLDivElement | null> = ref(null)

let pixi: Application | null = null
let renderCount = 0

export const useCanvas = () => {
  const backgroundColour = 'lightgrey'
  const foregroundColour = '#17202a'

  const voiceColours = ['#8e0000', '#4a0072', '#0000b2', '#004d40']

  // const foregroundColour2 = '#d0d3d4'
  const pageContainer = new Container({ label: 'page' })

  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      console.log('HOT RELOAD!')
      drawScore()
    })
  }

  const {
    score,
    note: currentNote,
    element: currentElement,
    bar: currentBar,
    track: currentTrack,
    selection,
    voiceId,
  } = useCursor()

  const drawBar = (bar: Bar, barWidth: number, barHeight: number, trackHeight: number): Container => {
    const x = barWidth * (bar.index() % score.value.barsPerLine)
    const y = trackHeight * Math.floor(bar.index() / score.value.barsPerLine)

    const c = new Container({
      label: `bar${bar.index()}`,
      x: x,
      y: y,
    }).on('pointerdown', c => {
      console.log('Bar clicked', bar.index())
      // bar._track.removeBarAt(bar.index())
      // drawScore()
    })
    c.interactive = true

    const stringSpacing = barHeight / (bar.track().stringCount() - 1)

    const g = new Graphics()

    for (let i = 0; i < bar.track().stringCount(); i++) {
      const lineY = i * stringSpacing
      g.moveTo(0, lineY).lineTo(barWidth, lineY)
    }

    // Draw vertical start and end bars
    g.moveTo(0, 0)
      .lineTo(0, barHeight)
      .moveTo(barWidth, 0)
      .lineTo(barWidth, barHeight) // End bar
      .stroke({ width: 2, color: 'black' })

    const textStyle = new TextStyle({
      fontSize: bar.score().fontSize,
      fill: 0x555555, // Text color
    })

    // Create the text
    const t = new Text({
      text: bar.index(),
      style: textStyle,
      x: 0,
      y: -1.5 * bar.score().fontSize,
    } as TextOptions)

    c.addChild(g)
    c.addChild(t)

    bar._voices.forEach(voice => {
      c.addChild(drawVoice(voice, barWidth, barHeight))
    })
    return c
  }

  const voiceColor = (voice: Voice) => {
    return voiceColours[voice.index()]
  }

  const drawNote = (note: Note, barHeight: number) => {
    const stringSpacing = barHeight / (note.track().stringCount() - 1)
    const isCurrent = toRaw(currentNote.value) === toRaw(note)
    const rectColor = isCurrent ? voiceColor(note.voice()) : backgroundColour
    if (note.fretNumber == 4) {
      // debugger
    }
    const textColor = isCurrent ? backgroundColour : voiceColor(note.voice())

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
      const stringCount = element.track().stringCount()
      const g = new Graphics()

      if (
        element.beatDuration() > 10 ||
        element.beatDuration() < -10 ||
        element.beatDuration() == null ||
        element.beatDuration() == undefined
      ) {
        console.log('##### Invalid duration', element)
        debugger
        element.duration = new Duration(1)
      }

      g.moveTo(score.value.fontSize * 0.5 - element.beatDuration(), score.value.fontSize * (stringCount + 0.25))
        .lineTo(score.value.fontSize * 0.5 - element.beatDuration(), score.value.fontSize * (stringCount + 1))
        .stroke({ width: 2 * element.beatDuration(), color: voiceColor(element.voice()) })

      const flagCount =
        element.tailType() == TailType.Beam || element.tailType() == TailType.Flag ? element.tailCount() : 0

      if (element.tailCount() > 0) {
        // debugger
      }
      // horizontal
      for (let i = 0; i < flagCount; i++) {
        g.moveTo(score.value.fontSize * 0.5 - element.beatDuration(), score.value.fontSize * (stringCount + 1))
          .lineTo(
            score.value.fontSize * 0.5,
            score.value.fontSize * 0.5 +
              usableWidth * (0.8 * (element.beatDuration() / (element.tailType() == TailType.Flag ? 2 : 1))),
          )
          .stroke({ width: 2 * element.beatDuration(), color: 'orange' })
      }
      c.addChild(g)
    }

    element._notes.forEach(note => {
      c.addChild(drawNote(note, barHeight))
    })
    return c
  }

  const drawVoice = (voice: Voice, barWidth: number, barHeight: number) => {
    const padding = voice.score().fontSize
    const usableWidth = barWidth - padding * 2
    const c = new Container({ label: `voice${voice.index()}` })
    c.x = padding

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

      // console.log(voice.index(), voice.bar().index(), 'dimension', selectionDimension)
      const voiceDuration = Math.max(voice.bar().timeSignature.beatsPerBar, voice.duration())
      if (!isNaN(selectionDimension[0])) {
        g.rect(
          (selectionDimension[0] / voiceDuration) * usableWidth, // - voice.score().fontSize / 2,
          0,
          ((selectionDimension[1] - selectionDimension[0]) / voiceDuration) * usableWidth,
          barHeight,
        ).fill({ color: voiceColours[voice.index()], alpha: 0.25 })
        console.log('draw selection')
      }
      c.addChild(g)
    }

    voice._elements.forEach(element => {
      c.addChild(drawElement(element, usableWidth, barHeight))
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
        const scrollableElement = canvasElement.parentElement

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

  const drawScore = async () => {
    if (!score.value) {
      console.log('No score found')
      return
    }
    if (selection.value.length == 0) {
      console.log('Updates')
      selection.value = [toRaw(currentElement.value)]
    }
    console.log('DRAW SCORE')

    if (pixi == null) {
      pixi = new Application()

      const wrapper = document.getElementById('canvas-wrapper')!

      const resizeObserver = new ResizeObserver(entries => {
        console.log('resized')
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          console.log(`Wrapper resized: ${width}x${height} (${wrapper.clientWidth} ${wrapper.clientHeight})`)

          drawScore()
        }
      })

      // Start observing the div
      resizeObserver.observe(wrapper)
      // debugger

      await pixi.init({
        canvas: canvasRef.value!,
        // resizeTo: wrapper,
        backgroundColor: backgroundColour,
      })
      initDevtools(pixi)
    }

    const verticalGap = 50
    const horizontalGap = 20

    pageContainer.removeChildren()
    pixi.stage.removeChildren()
    // scoreContainer.removeChildren()

    const scoreContainer = new Container({ label: 'score' })
    const wrapper = document.getElementById('canvas-wrapper')!
    const canvasWidth = wrapper.clientWidth

    score.value!._tracks.forEach(track => {
      const usableWidth = canvasWidth - 2 * horizontalGap
      scoreContainer.addChild(drawTrack(track, usableWidth))
    })

    // pageContainer.addChild(
    //   new Text({
    //     text: score.value!.title,
    //     anchor: 0.5,
    //     x: canvasWidth / 2,
    //     y: 20,
    //     style: {
    //       fill: 0x000000,
    //       fontSize: 24,
    //     },
    //   }),
    // )

    scoreContainer.y = verticalGap
    scoreContainer.x = horizontalGap

    pageContainer.addChild(scoreContainer)

    if (pixi && pixi.renderer) {
      // debugger
      renderCount += 1
      // if (renderCount < 5) {
      //   debugger
      pixi!.renderer.resize(
        wrapper.clientWidth,
        Math.floor(Math.max(scoreContainer.height + verticalGap, wrapper.clientHeight)) - 1,
      )
      // }
    } else {
      console.warn(' RESIZE FAILED')
    }
    pixi.stage.addChild(pageContainer)
  }

  return { drawScore, canvasRef, canvasContainerRef, voiceColours }
}
