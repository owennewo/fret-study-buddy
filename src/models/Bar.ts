import { Voice } from './Voice'
import { type TimeSignature } from './Score'
import type { Track } from './Track'

class Bar {
  _track: Track
  timeSignature: TimeSignature
  voices: Voice[]

  constructor(track: Track, timeSignature: TimeSignature) {
    this._track = track
    this.timeSignature = timeSignature
    this.voices = []
  }

  // addVoice(voice: Voice): void {
  //   this.voices.push(voice)
  // }

  index = () => this._track.bars.indexOf(this)

  removeVoiceAt(index: number): void {
    if (index >= 0 && index < this.voices.length) {
      this.voices.splice(index, 1)
    }
  }

  addVoice = (): Voice => {
    // debugger
    const voice = new Voice(this)
    this.voices.push(voice)
    return voice
  }

  empty = () => this.voices.flatMap(voice => voice.elements).filter(element => !element.empty()).length == 0

  toJSON(): object {
    return {
      timeSignature: this.timeSignature,
      voices: this.voices.map(voice => voice.toJSON()),
    }
  }

  isError = (): boolean => {
    return this.voices.some(voice => voice.isError())
  }

  update(): void {
    this.voices.forEach(voice => {
      let barBeats = 0
      voice.elements.forEach(element => {
        barBeats += element.duration
      })
      if (barBeats != this.timeSignature.beatsPerBar) {
        console.error('Bar does not add up to time signature', barBeats, this.timeSignature.beatsPerBar)
      } else {
        console.log('Bar adds up to time signature', barBeats, this.timeSignature.beatsPerBar)
      }
    })
  }

  static fromJSON(track: Track, data: any): Bar {
    if (
      !data.timeSignature ||
      typeof data.timeSignature.beatsPerBar !== 'number' ||
      typeof data.timeSignature.beatValue !== 'number'
    ) {
      throw new Error("Invalid data format: 'timeSignature' must have 'beatsPerBar' and 'beatValue' as numbers.")
    }

    const bar = new Bar(track, data.timeSignature)

    if (data.voices && Array.isArray(data.voices)) {
      bar.voices = data.voices.map((voiceData: any) => Voice.fromJSON(bar, voiceData))
    } else {
      throw new Error("Invalid data format: 'voices' should be an array.")
    }

    return bar
  }
}

export { Bar }
