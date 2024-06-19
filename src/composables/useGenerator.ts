import { KEYS } from '../interfaces/music';
import type { Note, Score, Bar, Position, Options, Tuning, Instrument } from '../interfaces/music';

const toKeyIndex = (keyName: string) => {
    return KEYS.find(key => key.name === keyName)?.index ?? -1;
}

const toKeyName = (keyIndex: number) => {
    return KEYS.find(key => key.index === keyIndex)?.name ?? 'z0';
}

const toNoteIndex = (noteName: string) => {
    const octave = Number(noteName.slice(-1));
    return toKeyIndex(noteName.slice(0, -1)) + 12 * octave;
}

const toNoteName = (noteIndex: number) => {
    const octave = Math.floor(noteIndex / 12);
    const keyIndex = noteIndex % 12;
    return toKeyName(keyIndex) + octave;
}

const toNote = (noteIndex: number, stringIndexes: number[], position: Position) => {

    let selectedString = -1;
    let selectedFret = 99;
    for (let i = 0; i < stringIndexes.length; i++) {
        if (noteIndex >= (stringIndexes[i] + position.fret)) {
            const fret = noteIndex - stringIndexes[i];
            if (fret <= selectedFret) {
                selectedString = i + 1;
                selectedFret = fret;
            }
        }
    }
    if (selectedString == -1) {
        debugger;
        throw new Error(`Unable to find string for ${noteIndex} at fret ${position.fret}}`);
    } else {
        // console.log(`choosing ${selectedString} for note ${noteIndex}`);
    }

    return {
        index: noteIndex,
        keyOctave: toNoteName(noteIndex),
        octave: Math.floor(noteIndex / 12),
        key: toNoteName(noteIndex)[0],
        string: selectedString,
        fret: selectedFret

    } as Note;
}

const generateScore = (options: Options): Score => {//instrument: Instrument, key: string, tuning: Tuning, position: Position) => {

    const strings = options.tuning.strings.map(noteName => toNoteIndex(noteName));
    const octaves = 2;

    const lowestPossibleNote = toNote(strings[0] + options.position.fret, strings, options.position);

    const baseNoteName = (toKeyIndex(options.key.name) < toKeyIndex(lowestPossibleNote.key)) ? options.key.name + (lowestPossibleNote.octave + 1) : options.key.name + lowestPossibleNote.octave;
    const baseIndex = toNoteIndex(baseNoteName);


    const score = {
        name: `${options.tuning.name} Score`,
        bars: [] as Array<Bar>
    } as Score;

    let currentIndex = baseIndex;

    let currentBar = {
        notes: [] as Array<Note>
    } as Bar;

    for (let i = 0; i < octaves * 7 + 1; i++) {
        if (i % 4 == 0) {
            currentBar = {
                notes: []
            };
            score.bars.push(currentBar);
        }
        currentBar.notes.push(toNote(currentIndex, strings, options.position));
        currentIndex += options.mode.intervals[i % options.mode.intervals.length];
    }
    return score;
}

export { generateScore };
