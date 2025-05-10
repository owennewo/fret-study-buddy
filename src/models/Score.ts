import { Metadata } from './Metadata'
import { Track } from './Track'

interface TimeSignature {
  beatsPerBar: number // e.g., 4 for 4/4 time, 3 for 3/4 time
  beatValue: number // e.g., 4 for quarter note, 8 for eighth note
}

interface Error {
  track: number
  bar: number
  voice: number
  duration: number
  expectedDuration: number
}

class Score {
  metadata?: Metadata
  url: string
  tempo: number
  barsPerLine: number
  fontSize: number
  timeSignature: TimeSignature
  _tracks: Track[]

  constructor(
    tempo: number = 120,
    timeSignature: TimeSignature = { beatsPerBar: 4, beatValue: 4 },
  ) {

    this.metadata = new Metadata()
    this.barsPerLine = 4
    this.fontSize = 16
    this.tempo = tempo
    this.url = ''
    this.timeSignature = timeSignature
    this._tracks = []
  }

  addTrack(track: Track = Track.new(this)): void {
    this._tracks.push(track)
    track.addBar()
  }

  removeTrack(trackIndex: number): void {
    if (trackIndex >= 0 && trackIndex < this._tracks.length) {
      this._tracks.splice(trackIndex, 1)
    }
  }

  toJSON(): object {
    return {
      metadata: this.metadata ? this.metadata.toJSON() : null,
      url: this.url,
      tempo: this.tempo,
      timeSignature: this.timeSignature,
      barsPerLine: this.barsPerLine,
      fontSize: this.fontSize,
      tracks: this._tracks.map(track => track.toJSON()),
    }
  }

  clone(keepId = false): Score {
    // deep copy, e.g. to store in indexdb which throws DataCloneError when not happy
    const clonedScore = JSON.parse(JSON.stringify(this.toJSON())) as Score
    if (keepId && this.metadata!.id) {
      clonedScore.metadata!.id = this.metadata!.id
    }
    return clonedScore
  }

  errors(): Error[] {
    const errors: Error[] = []
    this._tracks.forEach((track, trackIndex) => {
      track._bars.forEach((bar, barIndex) => {
        bar._voices.forEach((voice, voiceIndex) => {
          // voice.elements.forEach((element, element) => {
          if (voice.duration() != this.timeSignature.beatsPerBar) {
            errors.push({
              track: trackIndex + 1,
              bar: barIndex + 1,
              voice: voiceIndex + 1,
              duration: voice.duration(),
              expectedDuration: this.timeSignature.beatsPerBar,
            })
          }
          // })
        })
      })
    })
    return errors
  }

  verify() {
    // debugger
    // console.log('verify score')
    this._tracks.forEach(track => {
      track.verify()
    })
  }

  static fromJSON(data: any): Score {
    const score = new Score(data.tempo, data.timeSignature)
    score.barsPerLine = data.barsPerLine
    // score.id = data.id
    score.metadata = Metadata.fromJSON(data.metadata)
    score.fontSize = data.fontSize ?? 16
    score.url = data.url ?? ''
    score._tracks = data.tracks.map((trackData: any) => Track.fromJSON(score, trackData))
    return score
  }

  static new(): Score {

    const score = new Score(100, {
      beatsPerBar: 4,
      beatValue: 4,
    })
    const track = Track.new(score)
    score.addTrack(track)
    return score
  }
}

export { Score, type TimeSignature }
