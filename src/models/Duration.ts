import { isNumber } from 'tone'

export enum BaseNoteValue {
  Whole = 4,
  Half = 2,
  Quarter = 1,
  Eighth = 0.5,
  Sixteenth = 0.25,
  ThirtySecond = 0.125,
  SixtyFourth = 0.0625,
  Grace = 0,
}

export class Duration {
  beats: BaseNoteValue
  dotCount: number // Number of dots
  isTriplet: boolean // Whether it's part of a triplet

  constructor(beats: BaseNoteValue, dotCount = 0, isTriplet = false) {
    this.beats = beats
    this.dotCount = dotCount
    this.isTriplet = isTriplet
  }

  // Calculate the actual duration based on modifiers
  getBeatDuration(): number {

    let duration = this.beats

    // Add dot modifiers (each dot adds half the value of the previous dot)
    for (let i = 0; i < this.dotCount; i++) {
      duration += duration / Math.pow(2, i + 1)
    }

    // Adjust for triplets (reduce duration to 2/3)
    if (this.isTriplet) {
      duration *= 2 / 3
    }

    return duration
  }

  increasebeats(): BaseNoteValue {
    const values = Object.values(BaseNoteValue).filter(value => typeof value === 'number') as number[] // Get all numeric enum values
    const currentIndex = values.indexOf(this.beats)
    if (currentIndex >= 0 && currentIndex < values.length - 1) {
      this.beats = values[currentIndex + 1] as BaseNoteValue
      return this.beats
    }
    return this.beats
  }

  decreasebeats(): BaseNoteValue {
    const values = Object.values(BaseNoteValue).filter(value => typeof value === 'number') as number[] // Get all numeric enum values

    const currentIndex = values.indexOf(this.beats)
    if (currentIndex > 0 && currentIndex < values.length) {
      this.beats = values[currentIndex - 1] as BaseNoteValue
      return this.beats
    }

    return this.beats
  }

  clone(): Duration {
    return Duration.fromJSON(this.toJSON())
  }

  // Convert to JSON
  toJSON(): object {
    return Object.assign(
      {
        beats: this.beats,
      },
      this.dotCount == 0 ? {}: { dotCount: this.dotCount },
      !this.isTriplet ? {}: { isTriplet: this.isTriplet},
    )
  }

  // Create a new Duration from JSON
  static fromJSON(data: any): Duration {
    if (isNumber(data)) {
      //deprecated
      return new Duration(data)
    } else {
      // remove legacy beatDuration
      return new Duration(data.beats ?? data.baseDuration, data.dotCount, data.isTriplet)
    }
  }
}
