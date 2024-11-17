import { Track } from './Track'

interface TimeSignature {
  beatsPerBar: number // e.g., 4 for 4/4 time, 3 for 3/4 time
  beatValue: number // e.g., 4 for quarter note, 8 for eighth note
}

class MusicalScore {
  id: number | null
  title: string
  tempo: number
  barsPerLine: number
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
      tracks: this.tracks.map(track => track.toJSON()),
    }
  }

  clone(keepId = false): MusicalScore {
    // deep copy, e.g. to store in indexdb which throws DataCloneError when not happy
    const clonedScore = JSON.parse(
      JSON.stringify(this.toJSON()),
    ) as MusicalScore
    if (keepId && this.id) {
      clonedScore.id = this.id
    }
    return clonedScore
  }

  update(): void {
    console.log('update score')
    this.tracks.flatMap(track => track.bars).forEach(bar => bar.update())
  }

  static fromJSON(data: any): MusicalScore {
    const score = new MusicalScore(data.title, data.tempo, data.timeSignature)
    score.barsPerLine = data.barsPerLine
    score.id = data.id
    score.tracks = data.tracks.map((trackData: any) =>
      Track.fromJSON(score, trackData),
    )
    score.update()
    return score
  }

  static new(): MusicalScore {
    const score = new MusicalScore('Untitled', 100, {
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

export { MusicalScore, type TimeSignature }