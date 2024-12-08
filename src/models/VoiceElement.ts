import type { Bar } from './Bar'
import { NotePosition, type MoveDirection } from './NotePosition'
import type { Score } from './Score'
import type { Track } from './Track'
import type { Voice } from './Voice'

enum TailType {
  None,
  Flag,
  Beam,
}

class VoiceElement {
  _voice: Voice
  duration: number // measured in beats could be a fraction (e.g., 0.5 for eighth note)
  _notes: NotePosition[] // 0 length = rest, 1 = note, 2+ = chord
  constructor(voice: Voice, duration: number, addRest = false) {
    this.duration = duration
    this._notes = [] // Rest by default if `notes` is undefined
    this._voice = voice
    if (addRest) {
      this.addRestNotes()
    }
  }

  score = (): Score => this.track().score()
  track = (): Track => this.bar().track()
  bar = (): Bar => this.voice().bar()
  voice = (): Voice => this._voice

  next = (): VoiceElement => {
    return this.voice()._elements[Math.min(this.index() + 1, this.voice()._elements.length - 1)]
  }

  prev = (): VoiceElement => {
    return this.voice()._elements[Math.max(this.index() - 1, 0)]
  }

  first = (): VoiceElement => {
    return this.voice()._elements[0]
  }

  last = (): VoiceElement => {
    return this.voice()._elements[this.voice()._elements.length - 1]
  }

  isRest(): boolean {
    return this._notes.length == 0 || this._notes.every(note => isNaN(note.fretNumber))
  }

  isNote(): boolean {
    return this._notes.length == 1
  }

  location(): number {
    const index = this._voice._elements.indexOf(this)

    return this._voice._elements
      .filter((element, i) => i < index)
      .reduce((acc, element) => {
        return acc + element.duration
      }, 0)
  }

  isChord(): boolean {
    return this._notes.length > 1
  }

  // prev(): VoiceElement | null {
  //   if (this.index() == 0) {
  //     if (this.bar().index() == 0) {
  //       return null
  //     } else {
  //       const
  //     }
  //     // look in previous bar
  //     const voiceId = this._voice.index()
  //     const prev

  //   }
  //   return this.voice()_voice._elements[index - 1]
  // }

  move(direction: MoveDirection): VoiceElement | null {
    const elementIndex = this.index()

    switch (direction) {
      case 'ArrowUp':
      case 'ArrowLeft':
        return this._voice._elements[Math.max(elementIndex - 1, 0)]
      case 'ArrowDown':
      case 'ArrowRight':
        return this._voice._elements[Math.min(elementIndex + 1, this._voice._elements.length - 1)]
    }
  }

  empty = () => {
    return this._notes.filter(note => !isNaN(note.fretNumber)).length == 0
  }

  index(): number {
    return this._voice._elements.indexOf(this)
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
    // if (this._notes.filter(note => !isNaN(note.fretNumber)).length > 0) {
    //   debugger
    // }

    if (this.tailCount() == 0) {
      return TailType.None
    }
    const nextElement = this.move('ArrowRight')
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
    const index = this._voice._elements.indexOf(this)
    return this._voice._elements.length == index + 1
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
    const stringLength = this.track().instrument.tuning.length
    for (let i = 0; i < stringLength; i++) {
      if (this._notes.find(note => note.index() === i)) {
        continue
      }
      this._notes.push(new NotePosition(this, NaN))
    }
  }

  static fromJSON(voice: Voice, data: any): VoiceElement {
    const element = new VoiceElement(voice, data.duration)
    const notes: NotePosition[] = data.notes
      ? data.notes.map((noteData: any) => NotePosition.fromJSON(element, noteData))
      : []
    element._notes = notes
    element.addRestNotes()
    return element
  }

  toJSON(): object {
    return {
      duration: this.duration,
      // notes: this._notes.filter(note => note.fretNumber !== null && !isNaN(note.fretNumber)).map(note => note.toJSON()),
      notes: this._notes.map(note => note.toJSON()),
    }
  }
}

export { VoiceElement, TailType }
