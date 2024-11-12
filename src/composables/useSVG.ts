import { type Ref, watch } from 'vue'
import * as d3 from 'd3'
import { MusicalScore } from '@/models/MusicalScore'
import { NotePosition } from '@/models/NotePosition'
import type { VoiceElement } from '@/models/VoiceElement'

export const dimensions = {
  stringSpacing: 30,
  barWidth: 250,
  barPadding: 20,
  rectPadding: 10,
  rectWidth: 20,
  rectHeight: 20,
}

export const useSVG = (
  svgRef: Ref<SVGElement | null>,
  score: Ref<MusicalScore>,
) => {
  const applyToActiveNotes = (
    callback: (element, node, note: NotePosition) => void,
  ) => {
    d3.selectAll('g.note.active').each((node, index, nodes) => {
      const note = d3.select(nodes[index]).datum()
      callback(nodes[index], node, note)
    })

    drawScore()
  }

  const drawScore = () => {
    if (!svgRef.value) {
      return
    }
    // console.log('Drawing score...', score.value);

    if (!score.value) {
      console.log('No score found')
      return
    }

    const svg = d3.select(svgRef.value)

    const svgWidth = svgRef.value?.viewBox?.baseVal.width
    const svgHeight = svgRef.value?.viewBox?.baseVal.height

    const numberOfBars = score.value.tracks[0].bars.length
    const numberOfTracks = score.value.tracks.length

    const lines = Math.ceil(numberOfBars / score.value.barsPerLine)

    // Calculate bar width and bar height based on the overall SVG dimensions
    const barWidth = svgWidth / Math.min(numberOfBars, score.value.barsPerLine)
    const barHeight = Math.min(barWidth / 2, svgHeight / numberOfTracks)
    const barPadding = 0.2

    const calcElementX = (element: VoiceElement) =>
      element
        ? barWidth *
          (0.1 +
            (0.8 * element.location) /
              element._voice._bar.timeSignature.beatsPerBar)
        : 0

    svg
      .selectAll('g.track')
      .data(score.value.tracks, (_, track_index) => 'track-' + track_index)
      .join('g')
      .attr('class', 'track')
      .attr(
        'transform',
        (_, track_index) => `translate(0, ${barHeight * track_index})`,
      )
      .each((track, track_index, tracks) => {
        const gTrack = d3.select(tracks[track_index])
        const stringHeight =
          (barHeight * (1 - barPadding * 2)) / (track.stringCount() - 1)

        gTrack
          .selectAll('g.bar')
          .data(track.bars, (_, bar_index) => 'bar-' + bar_index)
          .join('g')
          .attr('class', 'bar')
          .attr(
            'transform',
            (_, bar_index) =>
              `translate(${barWidth * (bar_index % score.value.barsPerLine)}, ${barHeight * Math.floor(bar_index / score.value.barsPerLine)})`,
          )
          .each((bar, bar_index, bars) => {
            const gBar = d3.select(bars[bar_index])

            // Bar Names
            gBar
              .selectAll('text.bar-name')
              .data([bar], () => 'bar-' + bar_index + '-name')
              .join('text')
              .attr('class', 'bar-name')
              .attr('x', barWidth * 0.02) // Relative to bar width
              .attr('y', barHeight * barPadding - 5)
              .attr('font-size', `${Math.ceil(stringHeight * 0.75)}px`)
              .text(bar => bar_index + 1)

            // Bar Lines
            const gBarLines = gBar
              .selectAll('g.bar-lines')
              .data([bar], () => 'bar-' + bar_index + '-lines')
              .join('g')
              .attr('class', 'bar-lines')

            // Horizontal Lines
            gBarLines
              .selectAll('line.bar.horizontal')
              .data(
                track.instrument.tuning,
                (_, string_index) =>
                  'bar-' + bar_index + '-lines-h' + string_index,
              )
              .join('line')
              .attr('x1', 0)
              .attr('x2', barWidth)
              .attr(
                'y1',
                (_, string_index) =>
                  barHeight * barPadding + string_index * stringHeight,
              )
              .attr(
                'y2',
                (_, string_index) =>
                  barHeight * barPadding + string_index * stringHeight,
              )
              .attr('class', 'bar horizontal')

            // Vertical Lines for Start and End
            gBarLines
              .selectAll('line.bar.vertical.start')
              .data(
                bar_index % score.value.barsPerLine === 0 ? [bar] : [],
                () => 'bar-' + bar_index + '-lines-start',
              )
              .join('line')
              .attr('x1', 0)
              .attr('x2', 0)
              .attr('y1', barHeight * barPadding)
              .attr('y2', barHeight * (1 - barPadding))
              .attr('class', 'bar vertical start')

            gBarLines
              .selectAll('line.bar.vertical.end')
              .data([bar], () => 'bar-' + bar_index + '-lines-end')
              .join('line')
              .attr('x1', barWidth)
              .attr('x2', barWidth)
              .attr('y1', barHeight * barPadding)
              .attr('y2', barHeight * (1 - barPadding))
              .attr('class', 'bar vertical end')
            // .attr('stroke', 'white');

            // Bar Voices
            gBar
              .selectAll('g.bar-voices')
              .data(
                bar.voices,
                (_, voice_index) => 'bar-' + voice_index + '-voices',
              )
              .join('g')
              .attr('class', 'bar-voices')
              .each(function (voice, voice_index) {
                const gVoice = d3
                  .select(this)
                  .selectAll('g.voice')
                  .data(
                    voice.elements,
                    (_, element_index) =>
                      'bar-' +
                      bar_index +
                      '-voice-' +
                      voice_index +
                      '-element-' +
                      element_index,
                  )
                  .join('g')
                  .attr('class', 'voice')
                  .each(function (element, element_index) {
                    const gElement = d3
                      .select(this)
                      .selectAll('g.element')
                      .data(
                        [element],
                        (_, element_index) =>
                          'bar-' +
                          bar_index +
                          '-voice-' +
                          voice_index +
                          '-element-' +
                          element_index,
                      )
                      .join('g')
                      .attr('class', 'element')
                      .attr('transform', (note, note_index) => {
                        return `translate(${calcElementX(element)}, 0)`
                      })

                    gElement
                      .selectAll('text.left-hand')
                      .data(
                        element.notes
                          .filter(note => !isNaN(note.leftHandFinger))
                          .reverse(),
                        (_, note_index) =>
                          'bar-' +
                          bar_index +
                          '-voice-' +
                          voice_index +
                          '-element-' +
                          element_index +
                          '-note-lh' +
                          note_index,
                      )
                      .join('text')
                      .attr('class', 'left-hand')
                      .attr('x', note => 15)
                      .attr('y', (note, index) => (9 + index) * stringHeight)
                      .text(note => note.leftHand())

                    gElement
                      .selectAll('text.right-hand')
                      .data(
                        element.notes
                          .filter(note => !isNaN(note.rightHandFinger))
                          .reverse(),
                        (_, note_index) =>
                          'bar-' +
                          bar_index +
                          '-voice-' +
                          voice_index +
                          '-element-' +
                          element_index +
                          '-note-lh' +
                          note_index,
                      )
                      .join('text')
                      .attr('class', 'left-hand')
                      .attr('x', note => 0) //calcElementX(element))
                      .attr('y', (note, index) => (9 + index) * stringHeight)
                      .text(note => note.rightHand())

                    const gNote = gElement
                      .selectAll('g.note')
                      .data(
                        element.notes,
                        (note, note_index) =>
                          'bar-' +
                          bar_index +
                          '-voice-' +
                          voice_index +
                          '-note-' +
                          note_index,
                      )
                      .join('g')
                      .attr('class', d => {
                        // console.log("log", d.active, d3.select(this).datum().active);
                        return `note ${d.active ? 'active' : ''} note ${isNaN(d.fretNumber) ? 'rest' : ''}`
                      })
                      .attr('transform', (note, note_index) => {
                        // const noteX = calcElementX(element); //barWidth * (0.1 + (0.8 * element.location / bar.timeSignature.beatsPerBar));
                        const noteY =
                          barHeight * barPadding +
                          (note.stringIndex - 1.5) * stringHeight
                        return `translate(0, ${noteY})`
                      })
                      .on('click', (_, note) => {
                        console.log('click', note)
                        const isCtrlPressed = event.ctrlKey || event.metaKey

                        if (!isCtrlPressed) {
                          applyToActiveNotes(
                            (_, __, note) => (note.active = false),
                          )
                        }
                        note.active = true
                        drawScore()
                      })

                    // Draw Note Vertical lines
                    gElement
                      .selectAll('line.note.vertical')
                      .data(
                        element => [element],
                        (_, note_index) =>
                          'bar-' +
                          bar_index +
                          '-voice-' +
                          voice_index +
                          '-note-line-vertical-' +
                          note_index,
                      )
                      .join('line')
                      .attr('x1', stringHeight * 0.5)
                      .attr('x2', stringHeight * 0.5)
                      .attr('y1', stringHeight * (track.stringCount() + 1))
                      .attr(
                        'y2',
                        element => stringHeight * (track.stringCount() + 2),
                      )
                      .attr('class', 'note vertical')

                    gElement
                      .selectAll('line.note.horizontal')
                      .data(
                        element =>
                          element.beamLines() > 0
                            ? Array(element.beamLines()).fill(element)
                            : [],
                        (_, note_index) =>
                          'bar-' +
                          bar_index +
                          '-voice-' +
                          voice_index +
                          '-note-line-horizontal-' +
                          note_index,
                      )
                      .join('line')
                      .attr('x1', stringHeight * 0.5)
                      .attr(
                        'x2',
                        element =>
                          stringHeight * 0.5 +
                          barWidth *
                            ((0.8 * element.duration) /
                              element._voice._bar.timeSignature.beatsPerBar),
                      )
                      .attr('y1', (_, beamIndex) => {
                        // Position each additional beam slightly above the previous one
                        const baseY = stringHeight * (track.stringCount() + 2)
                        return baseY - beamIndex * (stringHeight * 0.3) // Adjust the multiplier to control spacing between beams
                      })
                      .attr('y2', (_, beamIndex) => {
                        const baseY = stringHeight * (track.stringCount() + 2)
                        return baseY - beamIndex * (stringHeight * 0.3) // Adjust the multiplier to control spacing between beams
                      })
                      .attr('class', 'note horizontal')

                    // Draw Note Rectangles
                    gNote
                      .selectAll('rect.note')
                      .data(
                        note => [note],
                        (_, note_index) =>
                          'bar-' +
                          bar_index +
                          '-voice-' +
                          voice_index +
                          '-note-' +
                          note_index,
                      )
                      .join('rect')
                      .attr('x', note =>
                        note.fretNumber > 9 ? -stringHeight * 0.25 : 0,
                      )
                      .attr('y', 0)
                      .attr('width', note =>
                        note.fretNumber > 9
                          ? stringHeight * 1.5
                          : stringHeight * 1,
                      )
                      .attr('height', stringHeight * 1)
                      .attr('class', 'note')

                    // Draw Note Numbers
                    gNote
                      .selectAll('text.note')
                      .data(
                        note => [note],
                        (_, note_index) =>
                          'bar-' +
                          bar_index +
                          '-voice-' +
                          voice_index +
                          '-note-' +
                          note_index +
                          '-text',
                      )
                      .join('text')
                      .attr('x', stringHeight * 0.5)
                      .attr('y', stringHeight * 0.85)
                      .text(note =>
                        isNaN(note.fretNumber) ? '-' : note.fretNumber,
                      )
                      .attr('font-size', stringHeight * 1)
                      .attr('class', 'note')
                  })
              })
          })
      })
  }

  // svg.selectAll('g.bar')
  //     .data(score.value.bars, (_, index) => "bar-" + index)
  //     .join('g')
  //     .attr('class', 'bar')
  //     .attr('transform', (_, bar_index) => `translate(${(2 * dimensions.barPadding + dimensions.barWidth) * bar_index} ${2 * dimensions.barPadding})`)
  //     .each((bar, bar_index, bars) => {
  //         const gBar = d3.select(bars[bar_index]);

  //         gBar.selectAll('text.bar-name')
  //             .data([bar], () => "bar-" + bar_index + "-name")
  //             .join('text')
  //             .attr('class', 'bar-name')
  //             .attr('x', dimensions.barPadding)
  //             .attr('y', -15)
  //             .text((bar) => bar.name ? bar.name : bar_index)

  //         const gBarLines = gBar.selectAll('g.bar-lines')
  //             .data([bar], () => "bar-" + bar_index + "-lines")
  //             .join('g')
  //             .attr('class', 'bar-lines')

  //         if (bar_index == 0) {
  //             gBarLines.selectAll('line.bar.vertical.start')
  //                 .data([bar], () => "bar-" + bar_index + "-lines-start")
  //                 .join('line')
  //                 .attr('x1', (_, bar_index) => dimensions.barWidth * bar_index)
  //                 .attr('y1', 0)
  //                 .attr('x2', (_, bar_index) => dimensions.barWidth * bar_index)
  //                 .attr('y2', (numberStrings.value - 1) * dimensions.stringSpacing)
  //                 .attr('class', 'bar vertical start')
  //                 .attr('stroke', 'white')
  //         }

  //         gBarLines.selectAll('line.bar.vertical.end')
  //             .data([bar], () => "bar-" + bar_index + "-lines-end")
  //             .join('line')
  //             .attr('x1', dimensions.barWidth + 2 * dimensions.barPadding)
  //             .attr('y1', 0)
  //             .attr('x2', dimensions.barWidth + 2 * dimensions.barPadding)
  //             .attr('y2', (numberStrings.value - 1) * dimensions.stringSpacing)
  //             .attr('class', 'bar vertical end')
  //             .attr('stroke', 'white')

  //         gBarLines.selectAll('line.bar.horizontal')
  //             .data(score.value.strings, (_, string_index) => "bar-" + bar_index + "-lines-h" + string_index)
  //             .join('line')
  //             .attr('x1', 0)
  //             .attr('y1', (_, string_index) => 0 + string_index * dimensions.stringSpacing)
  //             .attr('x2', dimensions.barWidth + 2 * dimensions.barPadding)
  //             .attr('y2', (_, string_index) => string_index * dimensions.stringSpacing)
  //             .attr('class', 'bar horizontal')
  //             .attr('stroke', 'white');

  //         const gBarNotes = gBar.selectAll('g.bar-notes')
  //             .data([bar], () => "bar-" + bar_index + "-notes-group")
  //             .join('g')
  //             .attr('class', 'bar-notes')

  //         const gBarNote = gBarNotes.selectAll('g.note')
  //             .data(bar.lines.flat(), (note, note_index) => "bar-" + bar_index + "-lines-" + note.string_index + "-note-" + note_index)
  //             .join('g')
  //             .attr('class', 'note')
  //             .classed('rest', (note) => isNaN(note.fret))
  //             .classed('active', (note) => note.active)
  //             .on('click', (_, note) => {
  //                 const isCtrlPressed = event.ctrlKey || event.metaKey;

  //                 if (!isCtrlPressed) {
  //                     score.value.bars.forEach(bar => {
  //                         bar.lines.flat().forEach(n => {
  //                             n.active = false;
  //                         });
  //                     });

  //                 }
  //                 note.active = true;
  //                 drawScore();
  //             })
  //             .each((note, note_index, notes) => {

  //                 const gBarNote = d3.select(notes[note_index])
  //                     .attr('transform', (note: any, line_index: number) => {
  //                         return `translate(${dimensions.barPadding + note.location * dimensions.barWidth} ${(note.string_index) * dimensions.stringSpacing})`;
  //                     });

  //                 gBarNote.selectAll('rect')
  //                     .data([note], () => "bar-" + bar_index + "-note-" + note_index)
  //                     .join('rect')
  //                     .attr('x', 0)
  //                     .attr('y', - 10)
  //                     .attr('width', dimensions.rectWidth)
  //                     .attr('height', dimensions.rectHeight)

  //                 gBarNote.selectAll('text')
  //                     .data([note], () => "bar-" + bar_index + "-poly-" + note_index + "-text")
  //                     .join('text')
  //                     .text((note) => isNaN(note.fret) ? "-" : note.fret)
  //                     .attr('x', 5)
  //                     .attr('y', 5)
  //             });
  //     });
  // first = false;
  // };

  return { dimensions, drawScore }
}
