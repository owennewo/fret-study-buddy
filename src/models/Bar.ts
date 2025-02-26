import { Voice } from './Voice'
import { Score, type TimeSignature } from './Score'
import type { Track } from './Track'
import { toRaw } from 'vue'

type BarAttribute =
  | { type: 'BarStart' }
  | { type: 'BarEnd', repeatCount: number }
  | { type: 'Alternate', repeatCount: number }

class Bar {
  _track: Track
  timeSignature: TimeSignature
  _voices: Voice[]
  attributes: BarAttribute[] // Add attributes property

  constructor(track: Track, timeSignature: TimeSignature, attributes: BarAttribute[] = []) {
    this._track = track
    this.timeSignature = timeSignature
    this._voices = []
    this.attributes = attributes // Initialize attributes
  }

  score = (): Score => this.track().score()
  track = (): Track => this._track

  next = (extend = true): Bar | null => {
    if (this.index() == this.track()._bars.length - 1) {
      if (extend) {
        return this.track().addBar()
      } else {
        return null
      }
    } else {
      return this.track()._bars[this.index() + 1]
    }
  }

  prev = (): Bar => {
    return this.track()._bars[Math.max(this.index() - 1, 0)]
  }

  first = (): Bar => {
    return this.track()._bars[0]
  }

  last = (): Bar => {
    return this.track()._bars[this.track()._bars.length - 1]
  }

  index = () => this.track()._bars.indexOf(toRaw(this))

  removeVoiceAt(index: number): void {
    if (index >= 0 && index < this._voices.length) {
      this._voices.splice(index, 1)
    }
  }

  clone = (): Bar => {
    const barJson = this.toJSON()
    return Bar.fromJSON(this.track(), barJson)
  }

  addVoice = (): Voice => {
    // debugger
    const voice = new Voice(this)
    this._voices.push(voice)
    voice.addElement()
    return voice
  }

  empty = () => this._voices.flatMap(voice => voice._elements).filter(element => !element.empty()).length == 0

  toJSON(): object {
    return {
      timeSignature: this.timeSignature,
      voices: this._voices.map(voice => voice.toJSON()),
      attributes: this.attributes, // Include attributes in JSON
    }
  }

  isError = (): boolean => {
    return this._voices.some(voice => voice.isError())
  }

  static fromJSON(track: Track, data: any): Bar {
    if (
      !data.timeSignature ||
      typeof data.timeSignature.beatsPerBar !== 'number' ||
      typeof data.timeSignature.beatValue !== 'number'
    ) {
      throw new Error("Invalid data format: 'timeSignature' must have 'beatsPerBar' and 'beatValue' as numbers.")
    }

    const bar = new Bar(track, data.timeSignature, data.attributes || []) // Initialize attributes from JSON

    if (data.voices && Array.isArray(data.voices)) {
      bar._voices = data.voices.map((voiceData: any) => Voice.fromJSON(bar, voiceData))
    } else {
      throw new Error("Invalid data format: 'voices' should be an array.")
    }

    return bar
  }
}

export { Bar, type BarAttribute }
