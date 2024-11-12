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
  name: string
  samples: string[]
}

class Instrument {
  instrumentName: string
  tuningName: string
  toneName: string
  tuning: string[]
  tone: Tone

  constructor(
    instrumentName: string = 'Guitar',
    tuningName: string = 'Standard',
    toneName: string = 'Default',
  ) {
    this.instrumentName = instrumentName
    this.tuningName = tuningName
    this.toneName = toneName
    this.tuning = instruments[instrumentName].tunings[tuningName]
    this.tone = instruments[instrumentName].tones[toneName]
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
        name: 'guitar-acoustic',
        samples: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'D5'],
      },
      Acoustc: {
        name: 'guitar-acoustic',
        samples: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'd5'],
      },
      Electric: {
        name: 'guitar-electric',
        samples: ['E2', 'A2', 'D#3', 'F#3', 'C3', 'F#4'],
      },
      Nylon: {
        name: 'guitar-nylon',
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
        name: 'bass-electric',
        samples: ['E1', 'A#1', 'C#2', 'G2', 'C#3', 'G3', 'C#4', 'G4', 'C#5'],
      },
      Electric: {
        name: 'bass-electric',
        samples: ['E1', 'A#1', 'C#2', 'G2', 'C#3', 'G3', 'C#4', 'G4', 'C#5'],
      },
      Upright: {
        name: 'contrabass',
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
        name: 'cello',
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
        name: 'violin',
        samples: ['G3', 'C4', 'G4', 'E5', 'C6', 'G6'],
      },
    },
  },
}

export { instruments, Instrument }
