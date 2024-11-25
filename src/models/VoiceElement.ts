import { NotePosition } from './NotePosition'
import type { Voice } from './Voice'

enum TailType {
  None,
  Flag,
  Beam,
}

class VoiceElement {
  _voice: Voice
  duration: number // measured in beats could be a fraction (e.g., 0.5 for eighth note)
  notes: NotePosition[] // 0 length = rest, 1 = note, 2+ = chord
  constructor(voice: Voice, duration: number, addRest = false) {
    this.duration = duration
    this.notes = [] // Rest by default if `notes` is undefined
    this._voice = voice
    if (addRest) {
      this.addRestNotes()
    }
  }

  isRest(): boolean {
    return this.notes.length == 0 || this.notes.every(note => isNaN(note.fretNumber))
  }

  isNote(): boolean {
    return this.notes.length == 1
  }

  location(): number {
    const index = this._voice.elements.indexOf(this)

    return this._voice.elements
      .filter((element, i) => i < index)
      .reduce((acc, element) => {
        return acc + element.duration
      }, 0)
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

  empty = () => {
    return this.notes.filter(note => !isNaN(note.fretNumber)).length == 0
  }

  index(): number {
    return this._voice.elements.indexOf(this)
  }

  tailTypeName(): string {
    switch (this.tailType()) {
      case TailType.None:
        return 'None'
      case TailType.Flag:
        return 'Flag'
      case TailType.Beam:
        return 'Beam'
    }
  }

  tailType(): TailType {
    // if (this.notes.filter(note => !isNaN(note.fretNumber)).length > 0) {
    //   debugger
    // }

    if (this.tailCount() == 0) {
      return TailType.None
    }
    const nextElement = this.next()
    if (nextElement == null) {
      return TailType.Flag
    }

    if (Math.floor(nextElement?.location()) + 1 != Math.ceil(nextElement?.location() + nextElement?.duration)) {
      return TailType.Flag
    } else {
      return TailType.Beam
    }
  }

  isLast(): boolean {
    const index = this._voice.elements.indexOf(this)
    return this._voice.elements.length == index + 1
  }

  tailCount(): number {
    const endLocation = this.location() + this.duration
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
      if (this.notes.find(note => note.index() === i)) {
        continue
      }
      this.notes.push(new NotePosition(this, NaN))
    }
  }

  static fromJSON(voice: Voice, data: any): VoiceElement {
    const element = new VoiceElement(voice, data.duration)
    const notes: NotePosition[] = data.notes
      ? data.notes.map((noteData: any) => NotePosition.fromJSON(element, noteData))
      : []
    element.notes = notes
    element.addRestNotes()
    return element
  }

  toJSON(): object {
    return {
      duration: this.duration,
      notes: this.notes.filter(note => note.fretNumber !== null && !isNaN(note.fretNumber)).map(note => note.toJSON()),
    }
  }
}

export { VoiceElement, TailType }
