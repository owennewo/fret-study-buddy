
type Direction = 'up' | 'down' | 'updown' | 'downup' | 'updownbounce';

// enum NoteDuration {
//     WHOLE = 'w',
//     HALF = 'h',
//     QUARTER = 'q',
// }

export type Note = {
    index: number;
    keyOctave: string;
    octave: number;
    key: string;
    string: number;
    // duration: NoteDuration;
    fret: number;
    active: boolean;
}

export type Options = {
    // instrument: Instrument;
    key: Key;
    mode: Mode;
    position: Position;
    tuning: Tuning;
    bpm: number;
    // octaves: number;
}

export type Mode = {
    name: string;
    modeName: string;
    intervals: number[];
}

export type Position = {
    name: string;
    fret: number;
}


export const POSITIONS: Position[] = [
    {
        name: "Open",
        fret: 0
    },
    {
        name: "1st",
        fret: 1
    },
    {
        name: "2nd",
        fret: 2
    },
    {
        name: "3rd",
        fret: 3
    },
    {
        name: "4th",
        fret: 4
    },
    {
        name: "5th",
        fret: 5
    },
    {
        name: "6th",
        fret: 6
    },
    {
        name: "7th",
        fret: 7
    },
    {
        name: "8th",
        fret: 8
    },
    {
        name: "9th",
        fret: 9
    },
    {
        name: "10th",
        fret: 10
    },
    {
        name: "11th",
        fret: 11
    },
    {
        name: "12th",
        fret: 12
    },
];

export const MODES: Mode[] = [
    {
        name: "Major",
        modeName: "Ionian",
        intervals: [2, 2, 1, 2, 2, 2, 1]
    },
    {
        name: "Dorian Minor",
        modeName: "Dorian",
        intervals: [2, 1, 2, 2, 2, 1, 2],
    },
    {
        name: "Phrygian Minor",
        modeName: "Phrygian",
        intervals: [1, 2, 2, 2, 1, 2, 2],
    },
    {
        name: "Lydian Major",
        modeName: "Lydian",
        intervals: [2, 2, 2, 1, 2, 2, 1],
    },
    {
        name: "Mixolydian Major",
        modeName: "Mixolydian",
        intervals: [2, 2, 1, 2, 2, 1, 2],
    },
    {
        name: "Natural Minor",
        modeName: "Aeolian",
        intervals: [2, 1, 2, 2, 1, 2, 2],
    },
    {
        name: "Locrian Minor",
        modeName: "Locrian",
        intervals: [1, 2, 2, 1, 2, 2, 2],
    }
];

export type Key = {
    name: string;
    index: number;
}

export const KEYS = [
    {
        name: 'C',
        index: 0
    },
    {
        name: 'C#',
        index: 1
    },
    {
        name: 'D',
        index: 2
    },
    {
        name: 'D#',
        index: 3
    },
    {
        name: 'E',
        index: 4
    },
    {
        name: 'F',
        index: 5
    },
    {
        name: 'F#',
        index: 6
    },
    {
        name: 'G',
        index: 7
    },
    {
        name: 'G#',
        index: 8
    },
    {
        name: 'A',
        index: 9
    },
    {
        name: 'A#',
        index: 10
    },
    {
        name: 'B',
        index: 11
    }
]

export type Tuning = {
    name: string;
    shortName: string;
    instrument: string;
    strings: string[];
};

export const TUNINGS: Tuning[] = [
    {
        name: "Guitar 6 String Standard",
        shortName: "Standard",
        instrument: "Guitar",
        strings: ["E2", "A2", "D3", "G3", "B3", "E4"]
    },
    {
        name: "Guitar 6 String Drop D",
        shortName: "Drop D",
        instrument: "Guitar",
        strings: ["D2", "A2", "D3", "G3", "B3", "E4"]
    },
    {
        name: "Guitar 6 String Open D",
        shortName: "Open D",
        instrument: "Guitar",
        strings: ["D2", "A2", "D3", "F#3", "A3", "D4"]
    },
    {
        name: "Guitar 6 String Open G",
        shortName: "Open G",
        instrument: "Guitar",
        strings: ["D2", "G2", "D3", "G3", "B3", "D4"]
    },
    {
        name: "Guitar 6 String DADGAD",
        shortName: "DADGAD",
        instrument: "Guitar",
        strings: ["D2", "A2", "D3", "G3", "A3", "D4"]
    },
    {
        name: "Bass 4 String Standard",
        shortName: "Standard",
        instrument: "Bass",
        strings: ["E1", "A1", "D2", "G2"]
    },
    {
        name: "Bass 4 String Drop D",
        shortName: "Drop D",
        instrument: "Bass",
        strings: ["D1", "A1", "D2", "G2"]
    },
    {
        name: "Bass 4 String Half-Step Down",
        shortName: "Half-Step Down",
        instrument: "Bass",
        strings: ["D#1", "G#1", "C#2", "F#2"]
    },
    {
        name: "Cello Standard",
        shortName: "Standard",
        instrument: "Cello",
        strings: ["C2", "G2", "D3", "A3"]
    },
    {
        name: "Cello Fifth-Tuned",
        shortName: "Fifth-Tuned",
        instrument: "Cello",
        strings: ["C2", "G2", "D3", "A3"]
    },
    {
        name: "Violin Standard",
        shortName: "Standard",
        instrument: "Violin",
        strings: ["G3", "D4", "A4", "E5"]
    },
    {
        name: "Violin Open G",
        shortName: "Open G",
        instrument: "Violin",
        strings: ["G3", "D4", "G4", "B4"]
    },
    {
        name: "Violin Cross Tuning AEAE",
        shortName: "AEAE",
        instrument: "Violin",
        strings: ["A3", "E4", "A4", "E5"]
    },
    {
        name: "Mandolin Standard",
        shortName: "Standard",
        instrument: "Mandolin",
        strings: ["G3", "D4", "A4", "E5"]
    },
    {
        name: "Ukulele Standard",
        shortName: "Standard",
        instrument: "Ukulele",
        strings: ["G4", "C4", "E4", "A4"]
    },
    {
        name: "Ukulele Baritone",
        shortName: "Baritone",
        instrument: "Ukulele",
        strings: ["D3", "G3", "B3", "E4"]
    },
    {
        name: "Banjo 5 String Standard",
        shortName: "Standard",
        instrument: "Banjo",
        strings: ["G4", "D3", "G3", "B3", "D4"]
    },
    {
        name: "Viola Standard",
        shortName: "Standard",
        instrument: "Viola",
        strings: ["C3", "G3", "D4", "A4"]
    },
    {
        name: "Double Bass Standard",
        shortName: "Standard",
        instrument: "Double Bass",
        strings: ["E1", "A1", "D2", "G2"]
    }
];

export type Instrument = {
    name: string;
    tunings: Tuning[];
}

/* This is derived from tunings and is principally for the primevue dropdown to do grouped options */
export const INSTRUMENTS = TUNINGS.reduce((instruments: Instrument[], tuning) => {
    const instrument = instruments.find(instrument => instrument.name == tuning.instrument);
    if (instrument) {
        instrument.tunings.push(tuning);
    } else {
        instruments.push({ name: tuning.instrument, tunings: [tuning] });
    }
    return instruments;
}, [] as Instrument[]);

console.log("INSTRUMENTS", INSTRUMENTS);

type Bar = {
    // index: number;
    notes: Array<Note | Note[]>;
}

type Score = {
    name: string;
    bars: Bar[];
}

export { Instrument, Tuning };
export type { Note, Direction, Bar, Score };
