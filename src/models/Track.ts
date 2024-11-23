import { Instrument } from '@/models/Instruments'
import { Bar } from './Bar'
import type { Score } from './Score'
import { Voice } from './Voice'

class Track {
  _score: Score
  instrument: Instrument
  voiceCount: number
  bars: Bar[]

  constructor(
    score: Score,
    instrumentName: string = 'Guitar',
    tuningName: string = 'Standard',
    toneName: string = 'Default',
  ) {
    this._score = score
    this.instrument = new Instrument(instrumentName, tuningName, toneName)
    this.voiceCount = 1
    this.bars = []
  }

  addBar(index: number = NaN): Bar {
    const bar = new Bar(this, this._score.timeSignature)

    for (let i = 0; i < this.voiceCount; i++) {
      // const voice = new Voice(bar)
      bar.addVoice()
    }
    if (isNaN(index)) {
      this.bars.push(bar)
    } else {
      this.bars.splice(index, 0, bar)
    }
    return bar
  }

  index(): number {
    return this._score.tracks.indexOf(this)
  }

  stringCount = () => this.instrument.tuning.length

  removeBarAt(index: number): void {
    if (index >= 0 && index < this.bars.length) {
      this.bars.splice(index, 1)
    }
  }

  toJSON(): object {
    return {
      instrumentName: this.instrument.instrumentName,
      tuningName: this.instrument.tuningName,
      toneName: this.instrument.toneName,
      voiceCount: this.voiceCount ?? 1,
      bars: this.bars.map(bar => bar.toJSON()),
    }
  }

  static new(score: Score): Track {
    return new Track(score, 'Guitar', 'Standard', 'Default')
  }

  static fromJSON(score: Score, data: any): Track {
    const track = new Track(score, data.instrumentName, data.tuningName, data.toneName)
    track.voiceCount = data.voiceCount ?? 1
    track.bars = data.bars.map((barData: any) => Bar.fromJSON(track, barData))
    return track
  }
}

export { Track }
