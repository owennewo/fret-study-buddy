import { Instrument } from '@/models/Instruments'
import { Bar } from './Bar'
import type { Score } from './Score'
import { toRaw } from 'vue'
// import type { MoveDirection } from './Note'

class Track {
  _score: Score
  // instrument: Instrument
  sampleName: string
  tunings: string[]
  capo: number = 0
  _bars: Bar[]

  constructor(
    score: Score,
    sampleName: string,
    tunings: string[],
    //instrument: string = 'Guitar',
    //tuning: string = 'Standard',
    //tone: string = 'Default',
    capo: number = 0,
  ) {
    this._score = score
    this.sampleName = sampleName
    this.tunings = tunings
    // this.instrument = new Instrument(instrument, tuning, tone)
    this.capo = capo
    this._bars = []
  }

  score = (): Score => this._score

  addBar(index: number = NaN, newBar: Bar | null = null): Bar {
    let bar = newBar

    if (newBar == null) {
      const previousIndex = this._bars.length - 1
      const timeSignature =
        previousIndex == -1 ? this._score.timeSignature : { ...this._bars[previousIndex].timeSignature }
      bar = new Bar(this, timeSignature)
    }
    if (isNaN(index)) {
      this._bars.push(bar!)
    } else {
      this._bars.splice(index, 0, bar!)
    }

    if (newBar == null) {
      for (let i = 0; i < 4; i++) {
        bar!.addVoice()
      }
    }

    return bar!
  }

  index(): number {
    return this.score()._tracks.indexOf(toRaw(this))
  }

  stringCount = () => this.tunings.length;

  removeBarAt(index: number): void {
    if (index >= 0 && index < this._bars.length) {
      this._bars.splice(index, 1)
    }
  }

  toJSON(): object {
    return {
      // instrument: this.instrument.name,
      sampleName: this.sampleName,
      tunings: this.tunings,
      capo: this.capo,
      // tuning: this.instrument.tuning.name,
      // tone: this.instrument.tone.name,
      bars: this._bars.map(bar => bar.toJSON()),
    }
  }

  next = (): Track => {
    return this.score()._tracks[Math.min(this.index() + 1, this.score()._tracks.length - 1)]
  }

  prev = (): Track => {
    return this.score()._tracks[Math.max(this.index() - 1, 0)]
  }

  first = (): Track => {
    return this.score()._tracks[0]
  }

  last = (): Track => {
    return this.score()._tracks[this.score()._tracks.length - 1]
  }

  verify(): void {
    this._bars.forEach(bar => {
      if (bar._voices.length > 4) {
        console.log('Too many voices in bar, removing some')
        bar._voices = bar._voices.slice(0, 4)
      }
    })
    if (this._bars.length == 0) {
      this.addBar()
    }
    if (this._bars[0]._voices.length == 0) {
      this._bars[0].addVoice()
    }
    if (this._bars[0]._voices[0]._elements.length == 0) {
      this._bars[0]._voices[0].addElement()
    }
  }

  static new(score: Score): Track {
    return new Track(score, 'Guitar-Default', ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'])
  }

  static fromJSON(score: Score, data: any): Track {
    const track = new Track(score, data.sampleName ?? 'guitar-nylon', data.tunings ?? ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'], data.capo ?? 0)
    track._bars = data.bars.map((barData: any) => Bar.fromJSON(track, barData))
    return track
  }
}

export { Track }
