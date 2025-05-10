import { toRaw } from 'vue'
import type { Bar } from './Bar'
import type { Score } from './Score'
import type { Track } from './Track'
import type { Voice } from './Voice'
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

class Note {
  _element: VoiceElement
  fret: number // e.g., 0 (open string), 1, 2, etc.
  techniques: Technique[] // Optional technique
  rightHandFinger: Finger = NaN
  leftHandFinger: Finger = NaN

  constructor(
    element: VoiceElement,
    fret: number,
    techniques: Technique[] = [],
    leftHandFinger: Finger = NaN,
    rightHandFinger: Finger = NaN,
  ) {
    this._element = element
    this.fret = fret
    this.techniques = techniques
    this.leftHandFinger = leftHandFinger !== null ? NaN : leftHandFinger
    this.rightHandFinger = rightHandFinger !== null ? NaN : rightHandFinger
  }

  score = (): Score => this.track().score()
  track = (): Track => this.bar().track()
  bar = (): Bar => this.voice().bar()
  voice = (): Voice => this.element().voice()
  element = (): VoiceElement => this._element

  next = (): Note => {
    return this.element()._notes[Math.min(this.index() + 1, this.element()._notes.length - 1)]
  }

  prev = (): Note => {
    return this.element()._notes[Math.max(this.index() - 1, 0)]
  }

  first = (): Note => {
    return this.element()._notes[0]
  }

  last = (): Note => {
    return this.element()._notes[this.element()._notes.length - 1]
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

  isRest = (): boolean => isNaN(this.fret)

  pitch = (): string => {
    const instrument = this.track().instrument
    const base = instrument.tuning.notes[this.index()]
    const keyIndex = Note.toNoteIndex(base) + this.fret
    return Note.toNoteName(keyIndex)
  }

  debug = (prefix: string = 'note'): void => {
    console.log(prefix, {
      index: this.index(),
      note: {
        fret: this.fret,
        tailCount: this._element.tailCount(),
        tailTypeName: this._element.tailTypeName(),
        location: this._element.location(),
        duration: this._element.beatDuration(),
      },
      element: this._element.index() + '/' + this.voice()._elements.length,
      voice: this.voice().index() + '/' + this.bar()._voices.length,
      bar: this.bar().index() + '/' + this.track()._bars.length,
      track: this.track().index() + '/' + this.score()._tracks.length,
    })
  }

  index = () => {
    return this._element._notes.indexOf(toRaw(this))
  }

  move = (direction: MoveDirection): Note => {
    let noteIndex = this.index()
    let elementIndex = this._element.index()
    const voiceIndex = Math.max(this.voice().index(), 0)
    let barIndex = this.bar().index()
    switch (direction) {
      case 'ArrowUp':
        noteIndex = Math.max(noteIndex - 1, 0)
        return this._element._notes[noteIndex]
      case 'ArrowDown':
        noteIndex = Math.min(noteIndex + 1, this._element._notes.length - 1)
        return this._element._notes[noteIndex]
      case 'ArrowRight':
        if (elementIndex == this.voice()._elements.length - 1) {
          // last element of bar
          if (this.voice().isComplete()) {
            // no room, so we need to move to the next bar or extend the score
            if (barIndex == this.track()._bars.length - 1) {
              // last bar so extend
              const newBar = this.track().addBar()
              return newBar._voices[voiceIndex]._elements[0]._notes[noteIndex]
              // return nextElement._notes[noteIndex]
            } else {
              const newElement = this.track()._bars[barIndex + 1]._voices[voiceIndex]._elements[0]
              debugger
              newElement.duration = this._element.duration.clone()
              return newElement._notes[noteIndex]
            }
          } else {
            // there is room in this bar for a new element
            const newElement = this.voice().addElement() as VoiceElement
            debugger
            newElement.duration = this._element.duration.clone()
            return newElement._notes[noteIndex]
          }
        } else {
          // not the last element of the bar
          return this.voice()._elements[elementIndex + 1]._notes[noteIndex]
        }
      case 'ArrowLeft':
        if (elementIndex == 0) {
          if (barIndex == 0) {
            return this
          } else {
            barIndex -= 1
            const nextBar = this.track()._bars[barIndex]
            if (nextBar._voices[voiceIndex].empty()) {
              nextBar._voices[voiceIndex].addElement()
            }
            const nextElementId = nextBar._voices[voiceIndex]._elements.length - 1
            const nextElement = nextBar._voices[voiceIndex]._elements[nextElementId]
            console.log('nextElement', nextElement, noteIndex)
            const nextNote = nextElement._notes[noteIndex]

            console.log('bar', nextNote.bar().index())
            console.log('voice', nextNote.voice().index())
            console.log('element', nextNote._element.index())
            console.log('note', nextNote.index())

            console.log('nextNote', nextNote)

            return nextNote
          }
        } else {
          elementIndex = Math.max(elementIndex - 1, 0)
          return this.voice()._elements[elementIndex]._notes[noteIndex]
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
        // techniques: this.techniques,
      },
      this.techniques.length == 0 ? {}: { techniques: this.techniques},
      isNaN(this.fret) ? {} : { fret: this.fret},
      isNaN(this.leftHandFinger) ? {} : { leftHandFinger: this.leftHandFinger },
      isNaN(this.rightHandFinger) ? {} : { rightHandFinger: this.rightHandFinger },
    )
  }

  static fromJSON(element: VoiceElement, data: any): Note {
    return new Note(element, data.fret ?? data.fretNumber ?? NaN, data.techniques, data.leftHandFinger, data.rightHandFinger)
  }
}

export { Note, Technique, type MoveDirection }
