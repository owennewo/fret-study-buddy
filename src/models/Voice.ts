import type { Bar } from './Bar'
import { VoiceElement } from './VoiceElement'

class Voice {
  _bar: Bar
  elements: VoiceElement[]

  constructor(bar: Bar) {
    this._bar = bar
    this.elements = []
  }

  isError(): boolean {
    const barDuration = this.elements.reduce(
      (acc, element) => acc + element.duration,
      0,
    )
    return barDuration != this._bar.timeSignature.beatsPerBar
  }

  isComplete(): boolean {
    const barDuration = this.elements.reduce(
      (acc, element) => acc + element.duration,
      0,
    )
    return barDuration >= this._bar.timeSignature.beatsPerBar
  }

  extend(): VoiceElement | null {
    if (this.isComplete()) {
      return null
    } else {
      const duration = this.elements[-1]?.duration ?? 1
      const element = new VoiceElement(this, duration, true)
      this.elements.push(element)
      return element
    }
  }

  addElement(element: VoiceElement): void {
    element._voice = this
    this.elements.push(element)
  }

  removeElementAt(index: number): void {
    if (index >= 0 && index < this.elements.length) {
      this.elements.splice(index, 1)
    }
  }

  toJSON(): object {
    return {
      elements: this.elements.map(element => element.toJSON()),
    }
  }

  static fromJSON(bar: Bar, data: any): Voice {
    const voice = new Voice(bar)

    if (data.elements && Array.isArray(data.elements)) {
      voice.elements = data.elements.map((elementData: any) =>
        VoiceElement.fromJSON(voice, elementData),
      )
    } else {
      throw new Error("Invalid data format: 'elements' should be an array.")
    }

    return voice
  }
}

export { Voice }
