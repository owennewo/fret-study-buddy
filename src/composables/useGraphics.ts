import { ref, type Ref, watch } from 'vue';
import * as d3 from 'd3';
import type { Note, Score, Options } from '../interfaces/music';

export const dimensions = {
    stringSpacing: 30,
    barWidth: 250,
    barPadding: 20,
    rectPadding: 10,
    rectWidth: 20,
    rectHeight: 20,
};

export const useGraphics = (svgRef: Ref<SVGElement | null>, options: Ref<Options>, score: Ref<Score>) => {
    let first = true;

    const drawScore = () => {
        // console.log('Drawing score...', svgRef); //, score.value);
        if (!svgRef.value) {
            console.log('No SVG element found');
            return;
        }

        if (!score) {
            debugger;
            console.log('No score found');
            return;
        }

        console.log(score.value);

        const svg = d3.select(svgRef.value);

        svg.selectAll('g.bar')
            .data(score.value.bars, (_, index) => "bar-" + index)
            .join('g')
            .attr('class', 'bar')
            .attr('transform', (_, bar_index) => `translate(${dimensions.barPadding + dimensions.barWidth * bar_index} ${dimensions.barPadding})`)
            .each((bar, bar_index, nodes) => {
                const gBar = d3.select(nodes[bar_index]);

                const gBarLines = gBar.selectAll('g.bar-lines')
                    .data([bar], () => "bar-lines-" + bar_index)
                    .join('g')
                    .attr('class', 'bar-lines')

                gBarLines.selectAll('line.bar.vertical')
                    .data([bar], () => "bar-lines-" + bar_index + "v1")
                    .join('line')
                    .attr('x1', (_, bar_index) => dimensions.barWidth * bar_index)
                    .attr('y1', 0)
                    .attr('x2', (_, bar_index) => dimensions.barWidth * bar_index)
                    .attr('y2', (options.value.tuning.strings.length - 1) * dimensions.stringSpacing)
                    .attr('class', 'bar vertical')
                    .attr('stroke', 'white')
                gBarLines.selectAll('line.bar.vertical')
                    .data([bar], () => "bar-lines-" + bar_index + "v2")
                    .join('line')
                    .attr('x1', dimensions.barWidth)
                    .attr('y1', 0)
                    .attr('x2', dimensions.barWidth)
                    .attr('y2', (options.value.tuning.strings.length - 1) * dimensions.stringSpacing)
                    .attr('class', 'bar vertical')
                    .attr('stroke', 'white')

                gBarLines.selectAll('line.bar.horizontal')
                    .data(options.value.tuning.strings, (_, string_index) => "bar-lines-" + bar_index + "h" + string_index)
                    .join('line')
                    .attr('x1', 0)
                    .attr('y1', (_, string_index) => 0 + string_index * dimensions.stringSpacing)
                    .attr('x2', dimensions.barWidth)
                    .attr('y2', (_, string_index) => string_index * dimensions.stringSpacing)
                    .attr('class', 'bar horizontal')
                    .attr('stroke', 'white');

                const gBarNotes = gBar.selectAll('g.bar-notes')
                    .data([bar], () => "bar-notes-" + bar_index + "-group")
                    .join('g')
                    .attr('class', 'bar-notes')

                gBarNotes.selectAll('g.polynote')
                    .data(bar.notes, (_, poly_index) => "bar-" + bar_index + "-notes-" + bar_index + "-poly-" + poly_index + "-group")
                    .join('g')
                    .call(selection => {
                        selection.each(function (d: any) {
                            const group = d3.select(this);
                            if (group.attr("keyOctave") && group.attr("keyOctave") == d.keyOctave) {
                                console.log("poly", d.keyOctave, group.attr("keyOctave"));

                                group.transition()
                                    .duration(first ? 0 : 750)
                                    .attr('class', "polynote changing")
                                    .on('end', function () {
                                        d3.select(this)
                                            .attr('class', "polynote")
                                            .transition()
                                            .duration(250)
                                    });
                            }
                            group.attr("keyOctave", d.keyOctave);
                            // debugger;
                        })
                    })
                    .attr('transform', (_, poly_index) => `translate(${(poly_index + 1) * dimensions.barWidth / (bar.notes.length + 1)} 0)`)
                    .attr('class', 'polynote')
                    .each((polynote, poly_index, nodes) => {
                        if (Array.isArray(polynote)) {
                            console.log("chords", polynote);
                        } else {
                            const gPolynote = d3.select(nodes[poly_index]);
                            gPolynote.selectAll('rect.note')
                                .data([polynote], () => "bar-" + bar_index + "-poly-" + poly_index)
                                .join('rect')
                                .transition()
                                .duration(first ? 0 : 750)

                                .attr('x', 0)
                                .attr('y', (options.value.tuning.strings.length - polynote.string) * dimensions.stringSpacing - 10)
                                .attr('width', dimensions.rectWidth)
                                .attr('height', dimensions.rectHeight)
                                .attr('class', 'note')
                                .attr('fill', 'lightblue');
                            gPolynote.selectAll('text.note')
                                .data([polynote], () => "bar-" + bar_index + "-poly-" + poly_index + "-text")
                                .join('text')
                                .text(polynote.fret)
                                .transition()
                                .duration(first ? 0 : 750)
                                .attr('x', 5)
                                .attr('y', (options.value.tuning.strings.length - polynote.string) * dimensions.stringSpacing + 5)
                                .attr('class', 'note');

                        }
                    });
            });
        first = false;
    };

    watch(score, () => {
        console.log('Drawing score...', score);
        drawScore();
    }, { deep: true, immediate: true });

    watch(svgRef, (newSvgRef) => {
        if (newSvgRef) {
            drawScore();
        }
    });
    return { dimensions, drawScore };
};
