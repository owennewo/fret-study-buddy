import { nextTick, ref, type Ref } from 'vue'
import * as d3 from 'd3'
import { TailType, VoiceElement } from '@/models/VoiceElement'

import { useCursor } from '@/composables/useCursor'
import type { Bar } from '@/models/Bar'
import type { Track } from '@/models/Track'
import type { Voice } from '@/models/Voice'

const svgRef: Ref<SVGSVGElement | null> = ref(null)

export const useSVG = () => {
  const { score, track, trackId, bar, barId, voice, voiceId, element, elementId, note, noteId } = useCursor()

  const calcElementX = (element: VoiceElement, barWidth: number) =>
    element ? barWidth * (0.1 + (0.8 * element.location()) / element.bar().timeSignature.beatsPerBar) : 0

  const calculateTrackY = (currentTrack: Track) => {
    const trackY = score.value?._tracks.reduce((acc, track) => {
      if (track.index() >= currentTrack.index()) {
        return acc
      } else {
        return acc + (track.stringCount() - 1 + 4) * score.value?.fontSize
      }
    }, 0)

    return trackY
  }

  const drawTrackText = (gBar: d3.Selection, theTrack: Track, barPadding: number) => {
    const gInstrument = gBar
      .selectAll('g.instrument')
      .data([theTrack.instrument])
      .join('g')
      .attr('class', 'instrument')
      .attr('transform', `translate(0, ${barPadding})`)

    const gInstrumentName = gInstrument
      .selectAll('g.instrument-name')
      .data([theTrack.instrument])
      .join('g')
      .attr('class', 'instrument-name')
      .attr(
        'transform',
        `translate(0, ${(theTrack.instrument.tuning.length * score.value?.fontSize) / 2}) rotate(-90) `,
      )

    gInstrumentName
      .selectAll('text.instrument-name')
      .data([theTrack.instrument])
      .join('text')
      .attr('class', 'instrument-name')
      // .attr('transform', 'rotate(-90)')
      .attr('x', 0) // -theTrack.instrument.tuning.length * score.value.fontSize)
      .attr('y', score.value?.fontSize - 5)
      .attr('font-size', score.value.fontSize)
      .text(t => t.instrumentName)

    gInstrument
      .selectAll('text.string-name')
      .data(theTrack.instrument.tuning)
      .join('text')
      .attr('class', 'string-name')
      .attr('font-size', score.value.fontSize)
      .attr('x', 2 * score.value.fontSize - 2)
      .attr('y', (_, index) => score.value.fontSize * index)
      .text(t => t[0])
  }

  const drawVoice = (
    gVoice: any,
    v: any,
    barIndex: number,
    voiceIndex: number,
    barWidth: number,
    barPadding: number,
    stringCount: number,
  ) => {
    gVoice
      .selectAll('g.element')
      .data(v._elements, (_, elementIndex) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-element-' + elementIndex)
      .join('g')
      .attr('class', e => `element ${element.value == e ? 'current' : ''}`)
      .attr('transform', e => {
        return `translate(${calcElementX(e, barWidth)}, 0)`
      })
      .each((v: VoiceElement, index: number, nodes: SVGElement[]) => {
        const gElement = d3.select(nodes[index])
        const barIndex = v.bar().index()
        const voiceIndex = v.voice().index()
        const elementIndex = v.index()
        gElement
          .selectAll('text.left-hand')
          .data(
            v._notes.filter(note => !isNaN(note.leftHandFinger)).reverse(),
            (_, nodeIndex) =>
              'bar-' + barIndex + '-voice-' + voiceIndex + '-element-' + elementIndex + '-note-lh' + nodeIndex,
          )
          .join('text')
          .attr('class', 'left-hand')
          .attr('font-size', score.value.fontSize)
          .attr('x', score.value.fontSize)
          .attr('y', (_, index) => (9 + index) * score.value.fontSize)
          .text(n => n.leftHand())

        gElement
          .selectAll('text.right-hand')
          .data(
            v._notes.filter(n => !isNaN(n.rightHandFinger)).reverse(),
            (_, nodeIndex) =>
              'bar-' + barIndex + '-voice-' + voiceIndex + '-element-' + elementIndex + '-note-lh' + nodeIndex,
          )
          .join('text')
          .attr('class', 'left-hand')
          .attr('font-size', score.value.fontSize)
          .attr('x', 0) //calcElementX(element))
          .attr('y', (_, index) => (9 + index) * score.value.fontSize)
          .text(n => n.rightHand())

        const gNote = gElement
          .selectAll('g.note')
          .data(v._notes, (_, nodeIndex) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-' + nodeIndex)
          .join('g')
          .attr('class', d => {
            return `note ${d === note.value ? 'current' : ''} ${isNaN(d.fretNumber) ? 'rest' : ''}`
          })
          .attr('transform', n => {
            const noteY = barPadding + (n.index() - 0.5) * score.value.fontSize
            return `translate(0, ${noteY})`
          })
          .on('click', (_, n) => {
            n.debug('click')
            noteId.value = n.index()
            elementId.value = n.element().index()
            voiceId.value = n.voice().index()
            barId.value = n.bar().index()
            trackId.value = n.track().index()

            drawScore()
          })

        // Draw Note Vertical lines
        gElement
          .selectAll('line.note.vertical')
          .data(
            v => [v],
            (_, nodeIndex) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-line-vertical-' + nodeIndex,
          )
          .join('line')
          .attr('x1', score.value.fontSize * 0.5)
          .attr('x2', score.value.fontSize * 0.5)
          .attr('y1', score.value.fontSize * (stringCount + 1))
          .attr('y2', e => score.value.fontSize * (stringCount + 2))
          .attr('class', 'note vertical')

        gElement
          .selectAll('line.note.horizontal')
          .data(
            (e: VoiceElement) =>
              e.tailType() == TailType.Beam || e.tailType() == TailType.Flag ? Array(e.tailCount()).fill(e) : [],
            (_, nodeIndex: number) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-line-horizontal-' + nodeIndex,
          )
          .join('line')
          .attr('x1', score.value.fontSize * 0.5)
          .attr(
            'x2',
            e =>
              score.value.fontSize * 0.5 +
              barWidth *
                ((0.8 * (e.duration / (e.tailType() == TailType.Flag ? 2 : 1))) / e.bar().timeSignature.beatsPerBar),
          )
          .attr('y1', (_, beamIndex) => {
            // Position each additional beam slightly above the previous one
            const baseY = score.value.fontSize * (stringCount + 2)
            return baseY - beamIndex * (score.value.fontSize * 0.3) // Adjust the multiplier to control spacing between beams
          })
          .attr('y2', (e, beamIndex) => {
            const baseY = score.value.fontSize * (stringCount + 2)
            return baseY - (beamIndex + (e.tailType() == TailType.Flag ? 1 : 0)) * (score.value.fontSize * 0.3) // Adjust the multiplier to control spacing between beams
          })
          .attr('class', 'note horizontal')

        // Draw Note Rectangles
        gNote
          .selectAll('rect.note')
          .data(
            n => [n],
            (_, nodeIndex) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-' + nodeIndex,
          )
          .join('rect')
          .attr('x', n => (n.fretNumber > 9 ? -score.value.fontSize * 0.25 : 0))
          .attr('y', 0)
          .attr('width', n => (n.fretNumber > 9 ? score.value.fontSize * 1.5 : score.value.fontSize * 1))
          .attr('height', score.value.fontSize * 1)
          .attr('class', 'note')

        // Draw Note Numbers
        gNote
          .selectAll('text.note')
          .data(
            n => [n],
            (_, nodeIndex) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-' + nodeIndex + '-text',
          )
          .join('text')
          .attr('x', score.value.fontSize * 0.5)
          .attr('y', score.value.fontSize * 0.5)
          .text(n => {
            return isNaN(n.fretNumber) ? '-' : n.fretNumber
          })
          .attr('font-size', score.value.fontSize)
          .attr('class', n => `note ${n._element.index() == voiceId.value ? 'voice' : ''}`)

        gNote
          .selectAll('path.hammer')
          .data(n => [n].filter(n => n.techniques.includes('h')))
          .join('path')
          .attr(
            'd',
            n =>
              `M ${score.value.fontSize / 4}, -${score.value.fontSize / 4}
               A ${n._element.duration * 100},${score.value.fontSize * 2} 0 0,1 ${n._element.duration * 100}, -${score.value.fontSize / 4}`,
          )
          .attr('fill', 'none')
          .attr('class', 'hammer')

        gNote
          .selectAll('path.bend')
          .data(n => [n].filter(n => n.techniques.includes('b')))
          .join('path')
          .attr('transform', `translate ( ${1.5 * score.value.fontSize} 0 )`)
          .attr('d', n => `M 0 0 C 4 0 7 0 7 -9 L 4 -6 M 7 -9 L 10 -6`)
          .attr('fill', 'none')
          .attr('class', 'bend')

        gNote
          .selectAll('path.vibrato')
          .data(n => [n].filter(n => n.techniques.includes('v')))
          .join('path')
          .attr('transform', `translate ( 0 -${0.5 * score.value.fontSize} )`)
          .attr('d', n => `M 0 0 a 2 1 0 0 1 5 0 A 2 1 0 0 0 10 0`)
          .attr('fill', 'none')
          .attr('class', 'vibrato')
      })
  }

  const drawBarLines = (
    gBar: d3.Selection,
    theBar: Bar,
    barIndex: number,
    barWidth: number,
    barPadding: number,
    barHeight: number,
  ) => {
    const gBarLines = gBar
      .selectAll('g.bar-lines')
      .data([theBar], () => 'bar-' + barIndex + '-lines')
      .join('g')
      .attr('class', 'bar-lines')

    // Horizontal Lines
    gBarLines
      .selectAll('line.bar.horizontal')
      .data(theBar.track().instrument.tuning, (_, string_index) => 'bar-' + barIndex + '-lines-h' + string_index)
      .join('line')
      .attr('x1', 0)
      .attr('x2', barWidth)
      .attr('y1', (_, string_index) => barPadding + string_index * score.value.fontSize)
      .attr('y2', (_, string_index) => barPadding + string_index * score.value.fontSize)
      .attr('class', `bar horizontal`)

    // Vertical Lines for Start and End
    gBarLines
      .selectAll('line.bar.vertical.start')
      // .data(barIndex % score.value.barsPerLine === 0 ? [bar] : [], () => 'bar-' + barIndex + '-lines-start')
      .data([theBar], () => 'bar-' + barIndex + '-lines-start')
      .join('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', barPadding) //barPadding)
      .attr('y2', barPadding + barHeight) // barHeight * (1 - barPadding))
      .attr('class', 'bar vertical start')

    gBarLines
      .selectAll('line.bar.vertical.end')
      .data([theBar], () => 'bar-' + barIndex + '-lines-end')
      .join('line')
      .attr('x1', barWidth)
      .attr('x2', barWidth)
      .attr('y1', barPadding) //barPadding)
      .attr('y2', barPadding + barHeight) //barHeight * (1 - barPadding))
      .attr('class', 'bar vertical end')
  }

  const drawBar = (gBar: d3.Selection, theBar: Bar, barWidth: number, barPadding: number, barIndex: number) => {
    const stringCount = theBar.track().stringCount() ?? 6
    const barHeight = score.value.fontSize * (stringCount - 1) // 4 is for the top and bottom padding

    // Bar Names
    gBar
      .selectAll('text.bar-name')
      .data([theBar])
      .join('text')
      .attr('class', 'bar-name')
      .attr('x', barPadding * 0.25)
      .attr('y', barPadding * 0.5)
      .attr('font-size', `${score.value.fontSize}px`)
      .text(barIndex + 1)

    // Bar Lines
    drawBarLines(gBar, theBar, barIndex, barWidth, barPadding, barHeight)

    const voices = theBar._voices.reduce((acc, voice) => {
      if (voice.index() === voiceId.value) {
        acc.push(voice) // Add topVoice to the end
      } else {
        acc.unshift(voice) // Add other voices to the beginning
      }
      return acc
    }, [] as Array<Voice>)
    gBar
      .selectAll('g.voice')
      .data(voices, (_, voiceIndex) => 'bar-' + voiceIndex + '-voices')
      .join('g')
      .attr(
        'class',
        (v, voiceIndex) =>
          `voice ${v === voice.value ? 'current' : ''} ${voiceIndex} ${voiceId.value} ${voiceIndex == voices.length - 1 ? 'selected' : ''} ${voiceIndex} ${voiceId.value}`,
      )
      .each((v, voiceIndex, voices) => {
        const gVoice = d3.select(voices[voiceIndex])

        drawVoice(gVoice, v, barIndex, voiceIndex, barWidth, barPadding, stringCount)
      })
  }

  const drawScore = () => {
    console.log('Drawing score next tick')
    nextTick(() => {
      console.log('Drawing score')
      if (!svgRef.value || !track.value) {
        return
      }
      if (!score.value) {
        console.log('No score found')
        return
      }

      const svg = d3.select(svgRef.value)

      const svgWidth = svgRef.value?.viewBox?.baseVal.width
      // const svgHeight = svgRef.value?.viewBox?.baseVal.height

      const numberOfTracks = score.value._tracks.length
      const barWidth = (svgWidth - 4 * score.value.fontSize) / score.value.barsPerLine

      const totalStrings = score.value._tracks.reduce((acc, track) => acc + track.stringCount(), 0)
      const barPadding = score.value.fontSize * 2
      const trackHeight = score.value.fontSize * (totalStrings - numberOfTracks) + 2 * barPadding * numberOfTracks

      svg
        .selectAll('g.track')
        .data(score.value._tracks)
        .join('g')
        .attr('class', t => `track ${track.value == t ? 'current' : ''}`)
        .attr('transform', track => `translate(0, ${calculateTrackY(track)})`)
        .each((track, trackIndex, tracks) => {
          const gTrack = d3.select(tracks[trackIndex])
          drawTrackText(gTrack, track, barPadding)
          gTrack
            .selectAll('g.bar')
            .data(track._bars) //, (_, barIndex) => 'bar-' + barIndex)
            .join('g')
            .attr('class', b => `bar ${bar.value == b ? 'current' : ''} ${b.isError() ? 'error' : ''}`)
            .attr(
              'transform',
              (_, barIndex) =>
                `translate(${2 * score.value.fontSize + barWidth * (barIndex % score.value.barsPerLine)}, ${trackHeight * Math.floor(barIndex / score.value.barsPerLine)})`,
            )
            .each((bar, barIndex, bars) => {
              const gBar = d3.select(bars[barIndex])
              drawBar(gBar, bar, barWidth, barPadding, barIndex)
            })
        })
    })
  }

  return { drawScore, svgRef }
}
