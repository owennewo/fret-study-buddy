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
  Vibrato = 'v',
  Tie = '=',
}

type MoveDirection = 'ArrowUp' | 'ArrowDown' | 'ArrowRight' | 'ArrowLeft'

// 0 = thumb, 1 = index, 2 = middle, 3 = ring, 4 = pinky
type Finger = typeof NaN | 0 | 1 | 2 | 3 | 4

class NotePosition {
  _element: VoiceElement
  // stringIndex: number // 1 to 6 (1 = high E, 6 = low E)
  fretNumber: number // e.g., 0 (open string), 1, 2, etc.
  techniques: Technique[] // Optional technique
  active: boolean = false // used for UI feedback
  rightHandFinger: Finger = NaN
  leftHandFinger: Finger = NaN

  constructor(
    element: VoiceElement,
    // stringIndex: number,
    fretNumber: number,
    techniques: Technique[] = [],
    leftHandFinger: Finger = NaN,
    rightHandFinger: Finger = NaN,
  ) {
    this._element = element
    // this.stringIndex = stringIndex
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

  toggleTechnique(technique: Technique): void {
    if (this.techniques.includes(technique)) {
      console.log('removing', technique)
      this.techniques = this.techniques.filter(t => t !== technique)
    } else {
      console.log('adding', technique)
      this.techniques.push(technique)
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
    const instrument = this._element._voice._bar._track.instrument
    const base = instrument.tuning[this.index()]
    const keyIndex = NotePosition.toNoteIndex(base) + this.fretNumber
    return NotePosition.toNoteName(keyIndex)
  }

  debug = (prefix: string = 'note'): void => {
    console.log(prefix, {
      note: {
        fretNumber: this.fretNumber,
        tailCount: this._element.tailCount(),
        tailTypeName: this._element.tailTypeName(),
        location: this._element.location(),
        duration: this._element.duration,
      },
      element: this._element.index() + '/' + this._element._voice.elements.length,
      voice: this._element._voice.index() + '/' + this._element._voice._bar.voices.length,
      bar: this._element._voice._bar.index() + '/' + this._element._voice._bar._track.bars.length,
      track: this._element._voice._bar._track.index() + '/' + this._element._voice._bar._track._score.tracks.length,
    })
  }

  index = () => {
    return this._element.notes.indexOf(this)
  }

  next = (direction: MoveDirection): NotePosition => {
    let noteIndex = this.index()
    let elementIndex = this._element.index()
    const voiceIndex = Math.max(this._element._voice.index(), 0)
    let barIndex = this._element._voice._bar.index()
    switch (direction) {
      case 'ArrowUp':
        noteIndex = Math.max(noteIndex - 1, 0)
        return this._element.notes[noteIndex]
      case 'ArrowDown':
        noteIndex = Math.min(noteIndex + 1, this._element.notes.length - 1)
        return this._element.notes[noteIndex]
      case 'ArrowRight':
        if (elementIndex == this._element._voice.elements.length - 1) {
          // last element of bar
          if (this._element._voice.isComplete()) {
            // no room, so we need to move to the next bar or extend the score
            if (barIndex == this._element._voice._bar._track.bars.length - 1) {
              // last bar so extend
              const newBar = this._element._voice._bar._track.addBar()
              return newBar.voices[voiceIndex].elements[0].notes[noteIndex]
              // return nextElement.notes[noteIndex]
            } else {
              const newElement = this._element._voice._bar._track.bars[barIndex + 1].voices[voiceIndex].elements[0]
              newElement.duration = this._element.duration
              return newElement.notes[noteIndex]
            }
          } else {
            // there is room in this bar for a new element
            const newElement = this._element._voice.addElement() as VoiceElement
            newElement.duration = this._element.duration
            return newElement.notes[noteIndex]
          }
        } else {
          // not the last element of the bar
          return this._element._voice.elements[elementIndex + 1].notes[noteIndex]
        }

      case 'ArrowLeft':
        if (elementIndex == 0) {
          if (barIndex == 0) {
            return this
          } else {
            barIndex -= 1
            const nextBar = this._element._voice._bar._track.bars[barIndex]
            if (nextBar.voices[voiceIndex].elements.length == 0) {
              nextBar.voices[voiceIndex].addElement()
            }
            const nextElementId = nextBar.voices[voiceIndex].elements.length - 1
            const nextElement = nextBar.voices[voiceIndex].elements[nextElementId]
            return nextElement.notes[noteIndex]
          }
        } else {
          elementIndex = Math.max(elementIndex - 1, 0)
          return this._element._voice.elements[elementIndex].notes[noteIndex]
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
        // stringIndex: this.stringIndex,
        fretNumber: this.fretNumber,
        techniques: this.techniques,
      },
      isNaN(this.leftHandFinger) ? {} : { leftHandFinger: this.leftHandFinger },
      isNaN(this.rightHandFinger) ? {} : { rightHandFinger: this.rightHandFinger },
    )
  }

  static fromJSON(element: VoiceElement, data: any): NotePosition {
    return new NotePosition(
      element,
      // data.stringIndex,
      data.fretNumber,
      data.techniques,
      data.leftHandFinger,
      data.rightHandFinger,
    )
  }
}

export { NotePosition, Technique }
