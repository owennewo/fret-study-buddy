type Note =
  `${'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'}${'#' | ''}${1 | 2 | 3 | 4 | 5}`

type InstrumentMap = {
  [instrument: string]: {
    tunings: {
      [tuning: string]: Note[]
    }
    tones: {
      [tone: string]: Tone
    }
  }
}

type Tone = {
  name?: string
  sampleName: string
  samples: string[]
}

type Tuning = {
  name: string
  notes: Note[]
}

class Instrument {
  name: string
  tuning: Tuning
  tone: Tone

  constructor(
    instrument: string = 'Guitar',
    tuning: string = 'Standard',
    tone: string = 'Default',
  ) {
    this.name = instrument
    this.tuning = {name: tuning, notes: instruments[instrument].tunings[tuning]}
    this.tone = {name: tone, samples: instruments[instrument].tones[tone].samples, sampleName: instruments[instrument].tones[tone].sampleName}
  }
}

const instruments: InstrumentMap = {
  Guitar: {
    tunings: {
      Standard: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
      'Drop-D': ['E4', 'B3', 'G3', 'D3', 'A2', 'D2'],
      'Open-D': ['D4', 'A3', 'F#3', 'D3', 'A2', 'D2'],
      'Open-G': ['D4', 'B3', 'G3', 'D3', 'G2', 'D2'],
      DADGAD: ['D4', 'A3', 'G3', 'D3', 'A2', 'D2'],
      'Drop-C': ['D4', 'A3', 'F3', 'C3', 'G2', 'C2'],
      'Drop-B': ['C#4', 'G#3', 'E3', 'B2', 'F#2', 'B1'],
      'Drop-A': ['G#3', 'E3', 'C#3', 'A2', 'E2', 'A1'],
      'Half-Step-Down': ['D#4', 'A#3', 'F#3', 'C#3', 'G#2', 'D#2'],
    },
    tones: {
      Default: {
        sampleName: 'guitar-acoustic',
        samples: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'D5'],
      },
      Acoustc: {
        sampleName: 'guitar-acoustic',
        samples: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'd5'],
      },
      Electric: {
        sampleName: 'guitar-electric',
        samples: ['E2', 'A2', 'D#3', 'F#3', 'C3', 'F#4'],
      },
      Nylon: {
        sampleName: 'guitar-nylon',
        samples: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'D5'],
      },
    },
  },
  Bass: {
    tunings: {
      Standard: ['G2', 'D2', 'A1', 'E1'],
      'Drop-D': ['G2', 'D2', 'A1', 'D1'],
      'Half-Step-Down': ['F#2', 'C#2', 'G#1', 'D#1'],
    },
    tones: {
      Default: {
        sampleName: 'bass-electric',
        samples: ['E1', 'A#1', 'C#2', 'G2', 'C#3', 'G3', 'C#4', 'G4', 'C#5'],
      },
      Electric: {
        sampleName: 'bass-electric',
        samples: ['E1', 'A#1', 'C#2', 'G2', 'C#3', 'G3', 'C#4', 'G4', 'C#5'],
      },
      Upright: {
        sampleName: 'contrabass',
        samples: ['F#1', 'A#1', 'D2', 'G#2', 'C#3', 'G#3', 'B3'],
      },
    },
  },
  Cello: {
    tunings: {
      Standard: ['A3', 'D3', 'G2', 'C2'],
      'The-Swan': ['G3', 'D3', 'G2', 'C2'],
    },
    tones: {
      Default: {
        sampleName: 'cello',
        samples: ['C2', 'G2', 'D3', 'A3', 'D4', 'A4', 'C5'],
      },
    },
  },
  Violin: {
    tunings: {
      Standard: ['E5', 'A4', 'D4', 'G3'],
      'Sonata-XI': ['D5', 'G4', 'C4', 'G3'],
    },
    tones: {
      Default: {
        sampleName: 'violin',
        samples: ['G3', 'C4', 'G4', 'E5', 'C6', 'G6'],
      },
    },
  },
}

export { instruments, Instrument }
