import { toRaw } from 'vue'
import type { Bar } from './Bar'
import { Note, type MoveDirection } from './Note'
import type { Score } from './Score'
import type { Track } from './Track'
import type { Voice } from './Voice'
import { Duration } from './Duration'

enum TailType {
  None,
  Flag,
  Beam,
}

class VoiceElement {
  _voice: Voice
  duration: Duration // measured in beats could be a fraction (e.g., 0.5 for eighth note)
  name: string | null
  _notes: Note[] // 0 length = rest, 1 = note, 2+ = chord
  constructor(voice: Voice, duration: Duration, addRest = false) {
    this.duration = duration
    this._notes = [] // Rest by default if `notes` is undefined
    this._voice = voice
    this.name = null
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
    return this._notes.length == 0 || this._notes.every(note => isNaN(note.fret))
  }

  isNote(): boolean {
    return this._notes.length == 1
  }

  beatDuration(): number {
    return this.duration.getBeatDuration()
  }

  location(): number {
    const index = this._voice._elements.indexOf(this)

    return this._voice._elements
      .filter((element, i) => i < index)
      .reduce((acc, element) => {
        return acc + element.beatDuration()
      }, 0)
  }

  isChord(): boolean {
    return this._notes.length > 1
  }

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
    return this._notes.filter(note => !isNaN(note.fret)).length == 0
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
    if (this.tailCount() == 0) {
      return TailType.None
    }
    const nextElement = this.move('ArrowRight')
    if (nextElement == null) {
      return TailType.Flag
    }

    if (Math.floor(nextElement?.location()) + 1 != Math.ceil(nextElement?.location() + nextElement?.beatDuration())) {
      return TailType.Flag
    } else {
      return TailType.Beam
    }
  }

  isLast(): boolean {
    const index = this._voice._elements.indexOf(toRaw(this))
    return this._voice._elements.length == index + 1
  }

  tailCount(): number {
    const endLocation = this.location() + this.beatDuration()
    if (endLocation - Math.floor(endLocation) === 0) {
      return 0
    } else {
      if (this.beatDuration() <= 0.125) {
        return 3
      } else if (this.beatDuration() <= 0.25) {
        return 2
      } else if (this.beatDuration() <= 0.5) {
        return 1
      } else {
        return 0
      }
    }
  }

  addRestNotes(): void {
    const stringLength = this.track().instrument.tuning.notes.length
    for (let i = 0; i < stringLength; i++) {
      if (this._notes.find(note => note.index() === i)) {
        continue
      }
      this._notes.push(new Note(this, NaN))
    }
  }

  static fromJSON(voice: Voice, data: any): VoiceElement {
    const element = new VoiceElement(voice, Duration.fromJSON(data.duration))
    const notes: Note[] = data.notes ? data.notes.map((noteData: any) => Note.fromJSON(element, noteData)) : []
    element._notes = notes
    element.name = data.name
    element.addRestNotes()
    return element
  }

  toJSON(): object {
    return Object.assign(
      {
        duration: this.duration.toJSON(),
        notes: this._notes.map(note => note.toJSON()),
      },
      this.name == null ? {}: { name: this.name},
    )
  }
}

export { VoiceElement, TailType }
