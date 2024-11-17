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

type MoveDirection = 'ArrowUp' | 'ArrowDown' | 'ArrowRight' | 'ArrowLeft'

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

  isRest = (): boolean => isNaN(this.fretNumber)

  pitch = (): string => {
    const instrument = this._voiceElement._voice._bar._track.instrument
    const base = instrument.tuning[this.stringIndex - 1]
    const keyIndex = NotePosition.toNoteIndex(base) + this.fretNumber
    return NotePosition.toNoteName(keyIndex)
  }

  debug = (prefix: string = 'note'): void => {
    console.log(prefix, {
      fretNumber: this.fretNumber,
      tailCount: this._voiceElement.tailCount(),
      tailTypeName: this._voiceElement.tailTypeName(),
      location: this._voiceElement.location(),
      duration: this._voiceElement.duration,
    })
  }

  index = () => {
    return this._voiceElement.notes.indexOf(this)
  }

  next = (direction: MoveDirection): NotePosition => {
    let noteIndex = this.index()
    let elementIndex = this._voiceElement.index()
    const voiceIndex = this._voiceElement._voice.index()
    let barIndex = this._voiceElement._voice._bar.index()
    switch (direction) {
      case 'ArrowUp':
        noteIndex = Math.max(noteIndex - 1, 0)
        return this._voiceElement.notes[noteIndex]
      case 'ArrowDown':
        noteIndex = Math.min(noteIndex + 1, this._voiceElement.notes.length - 1)
        return this._voiceElement.notes[noteIndex]
      case 'ArrowRight':
        if (elementIndex == this._voiceElement._voice.elements.length - 1) {
          // last element of bar
          if (this._voiceElement._voice.isComplete()) {
            // no room, so we need to move to the next bar or extend the score
            if (
              barIndex ==
              this._voiceElement._voice._bar._track.bars.length - 1
            ) {
              const newBar = this._voiceElement._voice._bar._track.addBar()
              const nextElement = newBar.voices[voiceIndex].extend()
              return nextElement.notes[0]
            }
          } else {
            // there is room in this bar for a new element
            const newElement = this._voiceElement._voice.extend()
            return newElement.notes[0]
          }
        } else {
          // not the last element of the bar
          // elementIndex = Math.min(
          //   elementIndex + 1,
          //   this._voiceElement._voice.elements.length - 1,
          // )
          return this._voiceElement._voice.elements[elementIndex + 1].notes[
            noteIndex
          ]
        }
      // }

      case 'ArrowLeft':
        if (elementIndex == 0) {
          if (barIndex == 0) {
            return this
          } else {
            barIndex -= 1
            const nextBar = this._voiceElement._voice._bar._track.bars[barIndex]
            if (nextBar.voices[voiceIndex].elements.length == 0) {
              nextBar.voices[voiceIndex].extend()
            }
            const nextElementId = nextBar.voices[voiceIndex].elements.length - 1
            const nextElement =
              nextBar.voices[voiceIndex].elements[nextElementId]
            return nextElement.notes[noteIndex]
          }
        } else {
          elementIndex = Math.max(elementIndex - 1, 0)
          return this._voiceElement._voice.elements[elementIndex].notes[
            noteIndex
          ]
        }
    }
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
