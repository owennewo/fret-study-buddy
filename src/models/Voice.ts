import { toRaw } from 'vue'
import type { Bar } from './Bar'
import type { MoveDirection } from './NotePosition'
import type { Score } from './Score'
import type { Track } from './Track'
import { VoiceElement } from './VoiceElement'

class Voice {
  _bar: Bar
  _elements: VoiceElement[]

  constructor(bar: Bar) {
    this._bar = bar
    this._elements = []
  }

  score = (): Score => this.track().score()
  track = (): Track => this.bar().track()
  bar = (): Bar => this._bar

  next = (): Voice => {
    return this.bar()._voices[Math.min(this.index() + 1, this.bar()._voices.length - 1)]
  }

  prev = (): Voice => {
    return this.bar()._voices[Math.max(this.index() - 1, 0)]
  }

  first = (): Voice => {
    return this.bar()._voices[0]
  }

  last = (): Voice => {
    return this.bar()._voices[this.bar()._voices.length - 1]
  }

  duration = () => this._elements.reduce((acc, element) => acc + element.duration, 0)

  isError = () => this.duration() != this._bar.timeSignature.beatsPerBar

  isComplete = () => this.duration() >= this._bar.timeSignature.beatsPerBar

  addElement(position: number = NaN): VoiceElement | null {
    const duration =
      this._elements.length > 0
        ? this._elements[this._elements.length - 1].duration // Last element in this._elements
        : (this.bar().prev()._voices[this.index()]?._elements.at(-1)?.duration ?? 1)

    const element = new VoiceElement(this, duration, true)
    if (isNaN(position)) {
      this._elements.push(element)
    } else {
      this._elements.splice(position, 0, element)
    }
    return element
    // }
  }

  move(direction: MoveDirection): Voice | null {
    const voiceIndex = this.index()

    switch (direction) {
      case 'ArrowUp':
      case 'ArrowLeft':
        return this._bar._voices[Math.max(voiceIndex - 1, 0)]
      case 'ArrowDown':
      case 'ArrowRight':
        if (voiceIndex + 1 >= 4) {
          return this
        } else {
          if (voiceIndex >= this._bar._voices.length - 1) {
            return this._bar.addVoice()
          } else {
            return this._bar._voices[voiceIndex + 1]
          }
        }
    }
  }

  empty = () => {
    return this._elements.length == 0
  }

  removeElementAt(index: number): void {
    if (index >= 0 && index < this._elements.length) {
      this._elements.splice(index, 1)
    }
  }

  index(): number {
    return this.bar()._voices.indexOf(toRaw(this))
  }

  toJSON(): object {
    return {
      elements: this._elements.map(element => element.toJSON()),
    }
  }

  static fromJSON(bar: Bar, data: any): Voice {
    const voice = new Voice(bar)

    if (data.elements && Array.isArray(data.elements)) {
      voice._elements = data.elements.map((elementData: any) => VoiceElement.fromJSON(voice, elementData))
    } else {
      throw new Error("Invalid data format: 'elements' should be an array.")
    }

    return voice
  }
}

export { Voice }
