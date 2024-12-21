import { computed, ref, toRaw, type Ref } from 'vue'
import { TailType, VoiceElement } from '@/models/VoiceElement'

import { useCursor } from '@/composables/useCursor'
import type { Bar } from '@/models/Bar'
import type { Track } from '@/models/Track'
import type { Voice } from '@/models/Voice'
import type { NotePosition } from '@/models/NotePosition'
import { Application, Container, Graphics, Text, TextStyle, type TextOptions } from 'pixi.js'
import { initDevtools } from '@pixi/devtools'
const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)
const canvasContainerRef: Ref<HTMLDivElement | null> = ref(null)

let pixi: Application | null = null

export const useCanvas = () => {
  const backgroundColour = 'lightgrey'
  const foregroundColour = '#17202a'
  // const foregroundColour2 = '#d0d3d4'
  const pageContainer = new Container({ label: 'page' })

  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      console.log('HOT RELOAD!')
      drawScore()
    })
  }

  const { score, note: currentNote, bar: currentBar, voiceId } = useCursor()

  // const drawVoice = (
  //   gVoice: any,
  //   v: any,
  //   barIndex: number,
  //   voiceIndex: number,
  //   barWidth: number,
  //   barPadding: number,
  //   stringCount: number,
  // ) => {
  //   gVoice
  //     .selectAll('g.element')
  //     .data(v._elements, (_, elementIndex) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-element-' + elementIndex)
  //     .join('g')
  //     .attr('class', e => `element ${element.value == e ? 'current' : ''}`)
  //     .attr('transform', e => {
  //       return `translate(${calcElementX(e, barWidth)}, 0)`
  //     })
  //     .each((v: VoiceElement, index: number, nodes: SVGElement[]) => {
  //       const gElement = d3.select(nodes[index])
  //       const barIndex = v.bar().index()
  //       const voiceIndex = v.voice().index()
  //       const elementIndex = v.index()
  //       gElement
  //         .selectAll('text.left-hand')
  //         .data(
  //           v._notes.filter(note => !isNaN(note.leftHandFinger)).reverse(),
  //           (_, nodeIndex) =>
  //             'bar-' + barIndex + '-voice-' + voiceIndex + '-element-' + elementIndex + '-note-lh' + nodeIndex,
  //         )
  //         .join('text')
  //         .attr('class', 'left-hand')
  //         .attr('font-size', score.value.fontSize)
  //         .attr('x', score.value.fontSize)
  //         .attr('y', (_, index) => (9 + index) * score.value.fontSize)
  //         .text(n => n.leftHand())

  //       gElement
  //         .selectAll('text.right-hand')
  //         .data(
  //           v._notes.filter(n => !isNaN(n.rightHandFinger)).reverse(),
  //           (_, nodeIndex) =>
  //             'bar-' + barIndex + '-voice-' + voiceIndex + '-element-' + elementIndex + '-note-lh' + nodeIndex,
  //         )
  //         .join('text')
  //         .attr('class', 'left-hand')
  //         .attr('font-size', score.value.fontSize)
  //         .attr('x', 0) //calcElementX(element))
  //         .attr('y', (_, index) => (9 + index) * score.value.fontSize)
  //         .text(n => n.rightHand())

  //       const gNote = gElement
  //         .selectAll('g.note')
  //         .data(v._notes, (_, nodeIndex) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-' + nodeIndex)
  //         .join('g')
  //         .attr('class', d => {
  //           return `note ${d === note.value ? 'current' : ''} ${isNaN(d.fretNumber) ? 'rest' : ''}`
  //         })
  //         .attr('transform', n => {
  //           const noteY = barPadding + (n.index() - 0.5) * score.value.fontSize
  //           return `translate(0, ${noteY})`
  //         })
  //         .on('click', (_, n) => {
  //           n.debug('click')
  //           noteId.value = n.index()
  //           elementId.value = n.element().index()
  //           voiceId.value = n.voice().index()
  //           barId.value = n.bar().index()
  //           trackId.value = n.track().index()

  //           drawScore()
  //         })

  //       // Draw Note Vertical lines
  //       gElement
  //         .selectAll('line.note.vertical')
  //         .data(
  //           v => [v],
  //           (_, nodeIndex) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-line-vertical-' + nodeIndex,
  //         )
  //         .join('line')
  //         .attr('x1', score.value.fontSize * 0.5)
  //         .attr('x2', score.value.fontSize * 0.5)
  //         .attr('y1', score.value.fontSize * (stringCount + 1))
  //         .attr('y2', e => score.value.fontSize * (stringCount + 2))
  //         .attr('class', 'note vertical')

  //       gElement
  //         .selectAll('line.note.horizontal')
  //         .data(
  //           (e: VoiceElement) =>
  //             e.tailType() == TailType.Beam || e.tailType() == TailType.Flag ? Array(e.tailCount()).fill(e) : [],
  //           (_, nodeIndex: number) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-line-horizontal-' + nodeIndex,
  //         )
  //         .join('line')
  //         .attr('x1', score.value.fontSize * 0.5)
  //         .attr(
  //           'x2',
  //           e =>
  //             score.value.fontSize * 0.5 +
  //             barWidth *
  //               ((0.8 * (e.duration / (e.tailType() == TailType.Flag ? 2 : 1))) / e.bar().timeSignature.beatsPerBar),
  //         )
  //         .attr('y1', (_, beamIndex) => {
  //           // Position each additional beam slightly above the previous one
  //           const baseY = score.value.fontSize * (stringCount + 2)
  //           return baseY - beamIndex * (score.value.fontSize * 0.3) // Adjust the multiplier to control spacing between beams
  //         })
  //         .attr('y2', (e, beamIndex) => {
  //           const baseY = score.value.fontSize * (stringCount + 2)
  //           return baseY - (beamIndex + (e.tailType() == TailType.Flag ? 1 : 0)) * (score.value.fontSize * 0.3) // Adjust the multiplier to control spacing between beams
  //         })
  //         .attr('class', 'note horizontal')

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
    switch (voice.index()) {
      case 0:
        return '#8e0000'
      case 1:
        return '#4a0072'
      case 2:
        return '#0000b2'
      case 3:
        return '#004d40'
      default:
        return 'black'
    }
  }

  const drawNote = (note: NotePosition, barHeight: number) => {
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
        // stroke: textColor,
      },
    } as TextOptions)

    g.chamferRect(-3, 0, t.width + 6, t.height - 2, 2).fill({ color: rectColor, alpha: 0.9 })

    // if (isCurrent) {
    //   // g.stroke({ color: foregroundColour })
    //   g.fill({ alpha: 0.8 })
    // }

    if (!isNaN(note.fretNumber) || isCurrent) {
      c.addChild(g)
    }
    if (!isNaN(note.fretNumber)) {
      c.addChild(t)
    }
    return c
  }

  const drawVoice = (voice: Voice, barWidth: number, barHeight: number) => {
    const padding = voice.score().fontSize * 2
    const usableWidth = barWidth - padding * 2
    const c = new Container({ label: `voice${voice.index()}` })
    c.x = padding

    voice._elements.forEach(element => {
      c.addChild(drawElement(element, usableWidth, barHeight))
    })
    return c
  }

  const drawElement = (element: VoiceElement, usableWidth: number, barHeight: number) => {
    const c = new Container({ label: `element${element.index()}` })

    c.x = (usableWidth * element.location()) / element.voice().duration()
    c.y = -element.score().fontSize / 2

    if (element.voice().index() == voiceId.value) {
      const stringCount = element.track().stringCount()
      const g = new Graphics()

      if (
        element.duration > 10 ||
        element.duration < -10 ||
        element.duration == null ||
        element.duration == undefined
      ) {
        console.log('##### Invalid duration', element)
        debugger
        element.duration = 1
      }

      g.moveTo(score.value.fontSize * 0.5 - element.duration, score.value.fontSize * (stringCount + 0.25))
        .lineTo(score.value.fontSize * 0.5 - element.duration, score.value.fontSize * (stringCount + 1))
        .stroke({ width: 2 * element.duration, color: voiceColor(element.voice()) })

      const flagCount =
        element.tailType() == TailType.Beam || element.tailType() == TailType.Flag ? element.tailCount() : 0

      if (element.tailCount() > 0) {
        debugger
      }
      // horizontal
      for (let i = 0; i < flagCount; i++) {
        g.moveTo(score.value.fontSize * 0.5 - element.duration, score.value.fontSize * (stringCount + 1))
          .lineTo(
            score.value.fontSize * 0.5,
            score.value.fontSize * 0.5 +
              usableWidth * (0.8 * (element.duration / (element.tailType() == TailType.Flag ? 2 : 1))),
          )
          .stroke({ width: 2 * element.duration, color: 'orange' })
      }
      c.addChild(g)
    }

    // gElement
    //   .selectAll('line.note.vertical')
    //   .data(
    //     v => [v],
    //     (_, nodeIndex) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-line-vertical-' + nodeIndex,
    //   )
    //   .join('line')
    //   .attr('x1', score.value.fontSize * 0.5)
    //   .attr('x2', score.value.fontSize * 0.5)
    //   .attr('y1', score.value.fontSize * (stringCount + 1))
    //   .attr('y2', e => score.value.fontSize * (stringCount + 2))
    //   .attr('class', 'note vertical')

    // gElement
    //   .selectAll('line.note.horizontal')
    //   .data(
    //     (e: VoiceElement) =>
    //       e.tailType() == TailType.Beam || e.tailType() == TailType.Flag ? Array(e.tailCount()).fill(e) : [],
    //     (_, nodeIndex: number) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-line-horizontal-' + nodeIndex,
    //   )
    //   .join('line')
    //   .attr('x1', score.value.fontSize * 0.5)
    //   .attr(
    //     'x2',
    //     e =>
    //       score.value.fontSize * 0.5 +
    //       barWidth *
    //         ((0.8 * (e.duration / (e.tailType() == TailType.Flag ? 2 : 1))) / e.bar().timeSignature.beatsPerBar),
    //   )
    //   .attr('y1', (_, beamIndex) => {
    //     // Position each additional beam slightly above the previous one
    //     const baseY = score.value.fontSize * (stringCount + 2)
    //     return baseY - beamIndex * (score.value.fontSize * 0.3) // Adjust the multiplier to control spacing between beams
    //   })
    //   .attr('y2', (e, beamIndex) => {
    //     const baseY = score.value.fontSize * (stringCount + 2)
    //     return baseY - (beamIndex + (e.tailType() == TailType.Flag ? 1 : 0)) * (score.value.fontSize * 0.3) // Adjust the multiplier to control spacing between beams
    //   })
    //   .attr('class', 'note horizontal')

    element._notes.forEach(note => {
      // if (!isNaN(note.fretNumber)) {
      // console.log('note', note.element().index(), note.index(), note.element().duration)
      c.addChild(drawNote(note, barHeight))
      // }
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
          // Get the visible region of the scrollable parent
          // const parentBounds = scrollableElement.getBoundingClientRect()
          console.log('selected bar', bar.index(), barContainer.getGlobalPosition().y, barContainer.getBounds().height)
          console.log('parent bounds', scrollableElement.scrollTop, scrollableElement.getBoundingClientRect().height)
          // Get the bar's global bounds
          // const barBounds = barContainer.getBounds()
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
            console.log('move not needed')
          }
          // Check if the bar is visible within the canvas
          // const isBarVisible = y1Visible && y2Visible

          // console.log('Is bar visible?', isBarVisible, `(${y1Visible} ${y2Visible})`)
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

    // debugger
    if (pixi == null) {
      pixi = new Application()

      const wrapper = document.getElementById('canvas-wrapper')!

      const resizeObserver = new ResizeObserver(entries => {
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

    const verticalGap = 80
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

    pageContainer.addChild(
      new Text({
        text: score.value!.title,
        anchor: 0.5,
        x: canvasWidth / 2,
        y: 20,
        style: {
          fill: 0x000000,
          fontSize: 24,
        },
      }),
    )

    scoreContainer.y = verticalGap
    scoreContainer.x = horizontalGap
    // scoreContainer.x = padding

    // pageContainer.addChild(
    //   new Graphics()
    //     .rect(0, 0, wrapper.clientWidth - 4, scoreContainer.height - 40)
    //     .stroke({ width: 1, color: 0x000000 }),
    // )

    // pageContainer.width = canvasWidth
    pageContainer.addChild(scoreContainer)

    // console.log('rerender', pageContainer.width, scoreContainer.height)

    if (pixi && pixi.renderer) {
      pixi!.renderer.resize(wrapper.clientWidth, Math.max(scoreContainer.height + verticalGap, wrapper.clientHeight))
    } else {
      console.warn(' RESIZE FAILED')
    }
    pixi.stage.addChild(pageContainer)
  }

  return { drawScore, canvasRef, canvasContainerRef }
}
