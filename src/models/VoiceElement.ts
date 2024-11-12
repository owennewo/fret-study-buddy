import { NotePosition } from './NotePosition'
import type { Voice } from './Voice'

class VoiceElement {
  _voice: Voice
  duration: number // measured in beats could be a fraction (e.g., 0.5 for eighth note)
  notes: NotePosition[] // 0 length = rest, 1 = note, 2+ = chord
  location: number = 0 // location in the bar measured in beats
  constructor(
    voice: Voice,
    location: number,
    duration: number,
    addRest = false,
  ) {
    this.location = location
    this.duration = duration
    this.notes = [] // Rest by default if `notes` is undefined
    this._voice = voice
    if (addRest) {
      this.addRestNotes()
    }
  }

  isRest(): boolean {
    return (
      this.notes.length == 0 || this.notes.every(note => isNaN(note.fretNumber))
    )
  }

  isNote(): boolean {
    return this.notes.length == 1
  }

  isChord(): boolean {
    return this.notes.length > 1
  }

  next(): VoiceElement | null {
    const index = this._voice.elements.indexOf(this)
    if (index < this._voice.elements.length - 1) {
      return this._voice.elements[index + 1]
    }
    return null
  }

  beamLines(): number {
    const endLocation = this.location + this.duration
    if (endLocation - Math.floor(endLocation) === 0) {
      return 0
    } else {
      if (this.duration <= 0.125) {
        return 3
      } else if (this.duration <= 0.25) {
        return 2
      } else if (this.duration <= 0.5) {
        return 1
      } else {
        return 0
      }
    }
  }

  addRestNotes(): void {
    const stringLength = this._voice._bar._track.instrument.tuning.length
    for (let i = 0; i < stringLength; i++) {
      if (this.notes.find(note => note.stringIndex === i + 1)) {
        continue
      }
      this.notes.push(new NotePosition(this, i + 1, NaN))
    }
  }

  static fromJSON(voice: Voice, data: any): VoiceElement {
    const voiceElement = new VoiceElement(voice, data.location, data.duration)
    const notes: NotePosition[] = data.notes
      ? data.notes.map((noteData: any) =>
          NotePosition.fromJSON(voiceElement, noteData),
        )
      : []
    voiceElement.notes = notes
    voiceElement.addRestNotes()
    return voiceElement
  }

  toJSON(): object {
    return {
      duration: this.duration,
      notes: this.notes
        .filter(note => note.fretNumber !== null && !isNaN(note.fretNumber))
        .map(note => note.toJSON()),
    }
  }
}

export { VoiceElement }
