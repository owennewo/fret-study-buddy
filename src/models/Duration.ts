import { isNumber } from 'tone'

export enum BaseNoteValue {
  Whole = 4,
  Half = 2,
  Quarter = 1,
  Eighth = 0.5,
  Sixteenth = 0.25,
  ThirtySecond = 0.125,
  SixtyFourth = 0.0625,
}

export class Duration {
  baseDuration: BaseNoteValue
  dotCount: number // Number of dots
  isTriplet: boolean // Whether it's part of a triplet

  constructor(baseDuration: BaseNoteValue, dotCount = 0, isTriplet = false) {
    this.baseDuration = baseDuration
    this.dotCount = dotCount
    this.isTriplet = isTriplet
  }

  // Calculate the actual duration based on modifiers
  getBeatDuration(): number {
    let duration = this.baseDuration

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

  increaseBaseDuration(): BaseNoteValue {
    const values = Object.values(BaseNoteValue).filter(value => typeof value === 'number') as number[] // Get all numeric enum values
    const currentIndex = values.indexOf(this.baseDuration)
    if (currentIndex >= 0 && currentIndex < values.length - 1) {
      this.baseDuration = values[currentIndex + 1] as BaseNoteValue
      return this.baseDuration
    }
    return this.baseDuration
  }

  decreaseBaseDuration(): BaseNoteValue {
    const values = Object.values(BaseNoteValue).filter(value => typeof value === 'number') as number[] // Get all numeric enum values

    const currentIndex = values.indexOf(this.baseDuration)
    if (currentIndex > 0 && currentIndex < values.length) {
      this.baseDuration = values[currentIndex - 1] as BaseNoteValue
      return this.baseDuration
    }

    return this.baseDuration
  }

  clone(): Duration {
    return Duration.fromJSON(this.toJSON())
  }

  // Convert to JSON
  toJSON(): object {
    return Object.assign(
      {
        baseDuration: this.baseDuration,
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
      return new Duration(data.baseDuration, data.dotCount, data.isTriplet)
    }
  }
}
