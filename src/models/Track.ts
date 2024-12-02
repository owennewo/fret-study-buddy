import { Instrument } from '@/models/Instruments'
import { Bar } from './Bar'
import type { Score } from './Score'

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
    const previousIndex = this.bars.length - 1
    const timeSignature =
      previousIndex == -1 ? this._score.timeSignature : { ...this.bars[previousIndex].timeSignature }
    const bar = new Bar(this, timeSignature)

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

  verify(): void {
    this.bars.forEach(bar => {
      if (bar.voices.length > this.voiceCount) {
        console.log('Too many voices in bar, removing some')
        bar.voices = bar.voices.slice(0, this.voiceCount)
      }
    })
    if (this.bars.length == 0) {
      this.addBar()
    }
    if (this.bars[0].voices.length == 0) {
      this.bars[0].addVoice()
    }
    if (this.bars[0].voices[0].elements.length == 0) {
      this.bars[0].voices[0].addElement()
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
