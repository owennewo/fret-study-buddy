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
  id: number | null
  title: string
  tempo: number
  barsPerLine: number
  fontSize: number
  timeSignature: TimeSignature
  tracks: Track[]

  constructor(
    title: string = 'Untitled',
    tempo: number = 120,
    timeSignature: TimeSignature = { beatsPerBar: 4, beatValue: 4 },
  ) {
    this.id = null
    this.title = title
    this.barsPerLine = 4
    this.fontSize = 12
    this.tempo = tempo
    this.timeSignature = timeSignature
    this.tracks = []
  }

  addTrack(track: Track = Track.new(this)): void {
    this.tracks.push(track)
  }

  removeTrack(trackIndex: number): void {
    if (trackIndex >= 0 && trackIndex < this.tracks.length) {
      this.tracks.splice(trackIndex, 1)
    }
  }

  toJSON(): object {
    return {
      title: this.title,
      tempo: this.tempo,
      timeSignature: this.timeSignature,
      barsPerLine: this.barsPerLine,
      fontSize: this.fontSize,
      tracks: this.tracks.map(track => track.toJSON()),
    }
  }

  clone(keepId = false): Score {
    // deep copy, e.g. to store in indexdb which throws DataCloneError when not happy
    const clonedScore = JSON.parse(JSON.stringify(this.toJSON())) as Score
    if (keepId && this.id) {
      clonedScore.id = this.id
    }
    return clonedScore
  }

  errors(): Error[] {
    const errors: Error[] = []
    this.tracks.forEach((track, trackIndex) => {
      track.bars.forEach((bar, barIndex) => {
        bar.voices.forEach((voice, voiceIndex) => {
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
    console.log('verify score')
    this.tracks.forEach(track => {
      track.verify()
    })
  }

  update(): void {
    console.log('update score')
    this.tracks.flatMap(track => track.bars).forEach(bar => bar.update())
  }

  static fromJSON(data: any): Score {
    const score = new Score(data.title, data.tempo, data.timeSignature)
    score.barsPerLine = data.barsPerLine
    score.id = data.id
    score.fontSize = data.fontSize ?? 12
    score.tracks = data.tracks.map((trackData: any) => Track.fromJSON(score, trackData))
    score.update()
    return score
  }

  static new(): Score {
    const score = new Score('Untitled', 100, {
      beatsPerBar: 4,
      beatValue: 4,
    })
    const track = Track.new(score)

    score.addTrack(track)
    track.addBar()
    // bar.addVoice(voice)
    return score
  }
}

export { Score, type TimeSignature }