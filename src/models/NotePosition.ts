import type { VoiceElement } from './VoiceElement'

const KEYS = [
  {
    name: 'C',
    index: 0,
  },
  {
    name: 'C#',
    index: 1,
  },
  {
    name: 'D',
    index: 2,
  },
  {
    name: 'D#',
    index: 3,
  },
  {
    name: 'E',
    index: 4,
  },
  {
    name: 'F',
    index: 5,
  },
  {
    name: 'F#',
    index: 6,
  },
  {
    name: 'G',
    index: 7,
  },
  {
    name: 'G#',
    index: 8,
  },
  {
    name: 'A',
    index: 9,
  },
  {
    name: 'A#',
    index: 10,
  },
  {
    name: 'B',
    index: 11,
  },
]

enum Technique {
  HammerOn = 'h',
  PullOff = 'p',
  SlideUp = 'S',
  SlideDown = 's',
  Bend = 'b',
  Harmonic = '^',
  PalmMute = 'x',
  Vibrato = '~',
  Tie = '=',
}

// 0 = thumb, 1 = index, 2 = middle, 3 = ring, 4 = pinky
type Finger = typeof NaN | 0 | 1 | 2 | 3 | 4

class NotePosition {
  _voiceElement: VoiceElement
  stringIndex: number // 1 to 6 (1 = high E, 6 = low E)
  fretNumber: number // e.g., 0 (open string), 1, 2, etc.
  techniques: Technique[] // Optional technique
  active: boolean = false // used for UI feedback
  rightHandFinger: Finger = NaN
  leftHandFinger: Finger = NaN

  constructor(
    voiceElement: VoiceElement,
    stringIndex: number,
    fretNumber: number,
    techniques: Technique[] = [],
    leftHandFinger: Finger = NaN,
    rightHandFinger: Finger = NaN,
  ) {
    this._voiceElement = voiceElement
    this.stringIndex = stringIndex
    this.fretNumber = fretNumber
    this.techniques = techniques
    this.leftHandFinger = leftHandFinger !== null ? NaN : leftHandFinger
    this.rightHandFinger = rightHandFinger !== null ? NaN : rightHandFinger
  }

  leftHand(): string {
    switch (this.leftHandFinger) {
      case 0:
        return 'T'
      case 1:
        return '1'
      case 2:
        return '2'
      case 3:
        return '3'
      case 4:
        return '4'
      default:
        return ''
    }
  }

  static toKeyIndex = (keyName: string) => {
    return KEYS.find(key => key.name === keyName)?.index ?? -1
  }

  static toKeyName = (keyIndex: number) => {
    return KEYS.find(key => key.index === keyIndex)?.name ?? 'z0'
  }

  static toNoteIndex = (noteName: string) => {
    const octave = Number(noteName.slice(-1))
    return this.toKeyIndex(noteName.slice(0, -1)) + 12 * octave
  }

  static toNoteName = (noteIndex: number) => {
    const octave = Math.floor(noteIndex / 12)
    const keyIndex = noteIndex % 12
    return this.toKeyName(keyIndex) + octave
  }

  pitch = (): string => {
    const instrument = this._voiceElement._voice._bar._track.instrument
    const base = instrument.tuning[this.stringIndex - 1]
    const keyIndex = NotePosition.toNoteIndex(base) + this.fretNumber
    return NotePosition.toNoteName(keyIndex)
  }

  rightHand(): string {
    switch (this.rightHandFinger) {
      case 0:
        return 'p'
      case 1:
        return 'i'
      case 2:
        return 'm'
      case 3:
        return 'a'
      case 4:
        return 'c'
      default:
        return ''
    }
  }

  toJSON(): object {
    return Object.assign(
      {
        stringIndex: this.stringIndex,
        fretNumber: this.fretNumber,
        techniques: this.techniques,
      },
      isNaN(this.leftHandFinger) ? {} : { leftHandFinger: this.leftHandFinger },
      isNaN(this.rightHandFinger)
        ? {}
        : { rightHandFinger: this.rightHandFinger },
    )
  }

  static fromJSON(voiceElement: VoiceElement, data: any): NotePosition {
    return new NotePosition(
      voiceElement,
      data.stringIndex,
      data.fretNumber,
      data.techniques,
      data.leftHandFinger,
      data.rightHandFinger,
    )
  }
}

export { NotePosition, type Technique }
