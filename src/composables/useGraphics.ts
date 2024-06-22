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

        // console.log(score.value);

        const svg = d3.select(svgRef.value);

        svg.selectAll('g.bar')
            .data(score.value.bars, (_, index) => "bar-" + index)
            .join('g')
            .attr('class', 'bar')
            .attr('transform', (_, bar_index) => `translate(${dimensions.barPadding + dimensions.barWidth * bar_index} ${dimensions.barPadding})`)
            .each((bar, bar_index, nodes) => {
                const gBar = d3.select(nodes[bar_index]);

                const gBarLines = gBar.selectAll('g.bar-lines')
                    .data([bar], () => "bar-" + bar_index + "-lines")
                    .join('g')
                    .attr('class', 'bar-lines')

                gBarLines.selectAll('line.bar.vertical')
                    .data([bar], () => "bar-" + bar_index + "-lines-v1")
                    .join('line')
                    .attr('x1', (_, bar_index) => dimensions.barWidth * bar_index)
                    .attr('y1', 0)
                    .attr('x2', (_, bar_index) => dimensions.barWidth * bar_index)
                    .attr('y2', (options.value.tuning.strings.length - 1) * dimensions.stringSpacing)
                    .attr('class', 'bar vertical')
                    .attr('stroke', 'white')
                gBarLines.selectAll('line.bar.vertical')
                    .data([bar], () => "bar-" + bar_index + "-lines-v2")
                    .join('line')
                    .attr('x1', dimensions.barWidth)
                    .attr('y1', 0)
                    .attr('x2', dimensions.barWidth)
                    .attr('y2', (options.value.tuning.strings.length - 1) * dimensions.stringSpacing)
                    .attr('class', 'bar vertical')
                    .attr('stroke', 'white')

                gBarLines.selectAll('line.bar.horizontal')
                    .data(options.value.tuning.strings, (_, string_index) => "bar-" + bar_index + "-lines-h" + string_index)
                    .join('line')
                    .attr('x1', 0)
                    .attr('y1', (_, string_index) => 0 + string_index * dimensions.stringSpacing)
                    .attr('x2', dimensions.barWidth)
                    .attr('y2', (_, string_index) => string_index * dimensions.stringSpacing)
                    .attr('class', 'bar horizontal')
                    .attr('stroke', 'white');

                const gBarNotes = gBar.selectAll('g.bar-notes')
                    .data([bar], () => "bar-" + bar_index + "-notes-group")
                    .join('g')
                    .attr('class', 'bar-notes')

                gBarNotes.selectAll('g.polynote')
                    .data(bar.notes, (_, poly_index) => "bar-" + bar_index + "-notes-" + bar_index + "-poly-" + poly_index + "-group")
                    .join('g')

                    .attr('class', 'polynote')
                    .call((d: any) => {
                        // console.log(d.attr("keyOctave"))
                        // debugger
                        // const group = d; //d3.select(selection);
                        const datum = d.datum();
                        // debugger;
                        if (d.attr("keyOctave") && (d.attr("keyOctave") !== datum.keyOctave || +d.attr("fret") !== datum.fret)) {
                            console.log("change", datum.keyOctave, d.attr("keyOctave"), datum.fret, +d.attr("fret"));

                            d.transition()
                                .duration(first ? 0 : 750)
                                .attr('transform', (polynote: any, poly_index: number) => `translate(${(poly_index + 1) * dimensions.barWidth / (bar.notes.length + 1)} ${(options.value.tuning.strings.length - polynote.string) * dimensions.stringSpacing})`)

                                .attr('class', "polynote active")
                                .on('end', function (this: SVGElement) { // Explicitly type `this` as SVGElement
                                    d3.select(this)
                                        .attr('class', 'polynote')
                                        .transition()
                                        .duration(250);
                                });
                        } else {
                            console.log("same", datum.keyOctave, d.attr("keyOctave"), datum.fret, +d.attr("fret"));
                            // debugger;
                            d.transition()
                                .duration(first ? 0 : 750)
                                .attr('transform', (polynote: any, poly_index: number) => `translate(${(poly_index + 1) * dimensions.barWidth / (bar.notes.length + 1)} ${(options.value.tuning.strings.length - polynote.string) * dimensions.stringSpacing})`)
                                .attr('class', (d: Note) => d.active ? 'polynote active' : 'polynote')
                        }
                        d.attr("keyOctave", datum.keyOctave);
                        d.attr("fret", datum.fret);
                        // debugger;

                    })

                    .each((polynote, poly_index, nodes) => {
                        if (Array.isArray(polynote)) {
                            console.log("chords", polynote);
                        } else {
                            const gPolynote = d3.select(nodes[poly_index]);

                            gPolynote.selectAll('rect')
                                .data([polynote], () => "bar-" + bar_index + "-poly-" + poly_index)
                                .join('rect')
                                .attr('x', 0)
                                .attr('y', - 10)
                                .attr('width', dimensions.rectWidth)
                                .attr('height', dimensions.rectHeight)

                            // .attr('fill', 'lightblue');
                            gPolynote.selectAll('text')
                                .data([polynote], () => "bar-" + bar_index + "-poly-" + poly_index + "-text")
                                .join('text')
                                .text(polynote.fret)
                                // .transition()
                                // .duration(first ? 0 : 750)
                                .attr('x', 5)
                                .attr('y', 5)
                            // .attr('class', 'note');

                        }
                    });
            });
        first = false;
    };

    watch(score, () => {
        // console.log('Drawing score...', score);
        drawScore();
    }, { deep: true, immediate: true });

    watch(svgRef, (newSvgRef) => {
        if (newSvgRef) {
            drawScore();
        }
    });
    return { dimensions, drawScore };
};
