import { nextTick, type Ref } from 'vue'
import * as d3 from 'd3'
import { TailType, VoiceElement } from '@/models/VoiceElement'

import { useCursor } from '@/composables/useCursor'
import type { Bar } from '@/models/Bar'
import type { Track } from '@/models/Track'

export const useSVG = (svgRef: Ref<SVGElement | null>) => {
  const { score, track, bar, voice, voiceId, element, note, resetCursor } = useCursor()
  const fontSize = 14

  const calcElementX = (element: VoiceElement, barWidth: number) =>
    element ? barWidth * (0.1 + (0.8 * element.location()) / element._voice._bar.timeSignature.beatsPerBar) : 0

  const calculateTrackY = (currentTrack: Track) => {
    const trackY = score.value.tracks.reduce((acc, track) => {
      if (track.index() >= currentTrack.index()) {
        return acc
      } else {
        return acc + (track.stringCount() - 1 + 4) * fontSize
      }
    }, 0)

    return trackY
  }

  const drawBar = (gBar: d3.Selection, bar: Bar, barWidth: number, barPadding: number, barIndex: number) => {
    const stringCount = bar._track.stringCount() ?? 6
    const barHeight = fontSize * (stringCount - 1) // 4 is for the top and bottom padding

    // Bar Names
    gBar
      .selectAll('text.bar-name')
      .data([bar])
      .join('text')
      .attr('class', 'bar-name')
      .attr('x', barWidth * 0.02)
      .attr('y', barPadding - 5)
      .attr('font-size', `${fontSize}px`)
      .text(bar => barIndex + 1)

    // Bar Lines
    const gBarLines = gBar
      .selectAll('g.bar-lines')
      .data([bar], () => 'bar-' + barIndex + '-lines')
      .join('g')
      .attr('class', 'bar-lines')

    // Horizontal Lines
    gBarLines
      .selectAll('line.bar.horizontal')
      .data(bar._track.instrument.tuning, (_, string_index) => 'bar-' + barIndex + '-lines-h' + string_index)
      .join('line')
      .attr('x1', 0)
      .attr('x2', barWidth)
      .attr('y1', (_, string_index) => barPadding + string_index * fontSize)
      .attr('y2', (_, string_index) => barPadding + string_index * fontSize)
      .attr('class', `bar horizontal`)

    // Vertical Lines for Start and End
    gBarLines
      .selectAll('line.bar.vertical.start')
      .data(barIndex % score.value.barsPerLine === 0 ? [bar] : [], () => 'bar-' + barIndex + '-lines-start')
      .join('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', barPadding) //barPadding)
      .attr('y2', barPadding + barHeight) // barHeight * (1 - barPadding))
      .attr('class', 'bar vertical start')

    gBarLines
      .selectAll('line.bar.vertical.end')
      .data([bar], () => 'bar-' + barIndex + '-lines-end')
      .join('line')
      .attr('x1', barWidth)
      .attr('x2', barWidth)
      .attr('y1', barPadding) //barPadding)
      .attr('y2', barPadding + barHeight) //barHeight * (1 - barPadding))
      .attr('class', 'bar vertical end')
    gBar
      .selectAll('g.voice')
      .data(bar.voices, (_, voice_index) => 'bar-' + voice_index + '-voices')
      .join('g')
      .attr(
        'class',
        (v, voice_index) =>
          `voice ${v === voice.value ? 'current' : ''} ${voice_index == voiceId.value ? 'selected' : ''} ${voice_index} ${voiceId.value}`,
      )
      .each(function (v, voice_index) {
        const gVoice = d3
          .select(this)
          .selectAll('g.element')
          .data(
            v.elements,
            (_, element_index) => 'bar-' + barIndex + '-voice-' + voice_index + '-element-' + element_index,
          )
          .join('g')
          .attr('class', e => `element ${element.value == e ? 'current' : ''}`)
          .attr('transform', e => {
            return `translate(${calcElementX(e, barWidth)}, 0)`
          })
          .each((v: VoiceElement, index: number, nodes: SVGElement[]) => {
            const gElement = d3.select(nodes[index])

            const barIndex = v._voice._bar.index()
            const voiceIndex = v._voice.index()
            const elementIndex = v.index()
            // console.log('element', e, this, x)
            // debugger
            gElement
              .selectAll('text.left-hand')
              .data(
                v.notes.filter(note => !isNaN(note.leftHandFinger)).reverse(),
                (_, nodeIndex) =>
                  'bar-' + barIndex + '-voice-' + voiceIndex + '-element-' + elementIndex + '-note-lh' + nodeIndex,
              )
              .join('text')
              .attr('class', 'left-hand')
              .attr('x', 15)
              .attr('y', (_, index) => (9 + index) * fontSize)
              .text(n => n.leftHand())

            gElement
              .selectAll('text.right-hand')
              .data(
                v.notes.filter(n => !isNaN(n.rightHandFinger)).reverse(),
                (_, nodeIndex) =>
                  'bar-' + barIndex + '-voice-' + voiceIndex + '-element-' + elementIndex + '-note-lh' + nodeIndex,
              )
              .join('text')
              .attr('class', 'left-hand')
              .attr('x', 0) //calcElementX(element))
              .attr('y', (_, index) => (9 + index) * fontSize)
              .text(n => n.rightHand())

            const gNote = gElement
              .selectAll('g.note')
              .data(v.notes, (_, nodeIndex) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-' + nodeIndex)
              .join('g')
              .attr('class', d => {
                return `note ${d === note.value ? 'current' : ''} ${isNaN(d.fretNumber) ? 'rest' : ''}`
              })
              .attr('transform', (n, nodeIndex) => {
                const noteY = barPadding + (n.index() - 0.5) * fontSize
                return `translate(0, ${noteY})`
              })
              .on('click', (_, n) => {
                n.debug('click')
                note.value = n
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
              .attr('x1', fontSize * 0.5)
              .attr('x2', fontSize * 0.5)
              .attr('y1', fontSize * (stringCount + 1))
              .attr('y2', e => fontSize * (stringCount + 2))
              .attr('class', 'note vertical')

            gElement
              .selectAll('line.note.horizontal')
              .data(
                (e: VoiceElement) =>
                  e.tailType() == TailType.Beam || e.tailType() == TailType.Flag ? Array(e.tailCount()).fill(e) : [],
                (_, nodeIndex: number) =>
                  'bar-' + barIndex + '-voice-' + voiceIndex + '-note-line-horizontal-' + nodeIndex,
              )
              .join('line')
              .attr('x1', fontSize * 0.5)
              .attr(
                'x2',
                e =>
                  fontSize * 0.5 +
                  barWidth *
                    ((0.8 * (e.duration / (e.tailType() == TailType.Flag ? 2 : 1))) /
                      e._voice._bar.timeSignature.beatsPerBar),
              )
              .attr('y1', (_, beamIndex) => {
                // Position each additional beam slightly above the previous one
                const baseY = fontSize * (stringCount + 2)
                return baseY - beamIndex * (fontSize * 0.3) // Adjust the multiplier to control spacing between beams
              })
              .attr('y2', (e, beamIndex) => {
                const baseY = fontSize * (stringCount + 2)
                return baseY - (beamIndex + (e.tailType() == TailType.Flag ? 1 : 0)) * (fontSize * 0.3) // Adjust the multiplier to control spacing between beams
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
              .attr('x', n => (n.fretNumber > 9 ? -fontSize * 0.25 : 0))
              .attr('y', 0)
              .attr('width', n => (n.fretNumber > 9 ? fontSize * 1.5 : fontSize * 1))
              .attr('height', fontSize * 1)
              .attr('class', 'note')

            // Draw Note Numbers
            gNote
              .selectAll('text.note')
              .data(
                n => [n],
                (_, nodeIndex) => 'bar-' + barIndex + '-voice-' + voiceIndex + '-note-' + nodeIndex + '-text',
              )
              .join('text')
              .attr('x', fontSize * 0.5)
              .attr('y', fontSize * 0.85)
              .text(n => {
                return isNaN(n.fretNumber) ? '-' : n.fretNumber
              })
              .attr('font-size', fontSize)
              .attr('class', n => `note ${n._element.index() == voiceId.value ? 'voice' : ''}`)
          })
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
      const svgHeight = svgRef.value?.viewBox?.baseVal.height

      const numberOfTracks = score.value.tracks.length
      const barWidth = svgWidth / score.value.barsPerLine

      const totalStrings = score.value.tracks.reduce((acc, track) => acc + track.stringCount(), 0)
      const barPadding = fontSize * 2
      const trackHeight = fontSize * (totalStrings - numberOfTracks) + 2 * barPadding * numberOfTracks

      svg
        .selectAll('g.track')
        .data(score.value.tracks)
        .join('g')
        .attr('class', t => `track ${track.value == t ? 'current' : ''}`)
        .attr('transform', track => `translate(0, ${calculateTrackY(track)})`)
        .each((track, trackIndex, tracks) => {
          const gTrack = d3.select(tracks[trackIndex])

          gTrack
            .selectAll('g.bar')
            .data(track.bars) //, (_, barIndex) => 'bar-' + barIndex)
            .join('g')
            .attr('class', b => `bar ${bar.value == b ? 'current' : ''} ${b.isError() ? 'error' : ''}`)
            .attr(
              'transform',
              (_, barIndex) =>
                `translate(${barWidth * (barIndex % score.value.barsPerLine)}, ${trackHeight * Math.floor(barIndex / score.value.barsPerLine)})`,
            )
            .each((bar, barIndex, bars) => {
              const gBar = d3.select(bars[barIndex])
              drawBar(gBar, bar, barWidth, barPadding, barIndex)
            })
        })
    })
  }

  return { drawScore }
}
