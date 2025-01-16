export class Metadata {
  createdDateTime: Date
  modifiedDateTime: Date
  clientId: string
  version: number
  hash: string

  constructor(createdDateTime = new Date(), modifiedDateTime = new Date(), clientId: string = '', version: number = 0, hash: string = '') {
    this.createdDateTime = createdDateTime
    this.modifiedDateTime = modifiedDateTime
    this.clientId = clientId
    this.version = version
    this.hash = hash
  }

  static fromJSON(data: any): Metadata {
    if (data) {
      return new Metadata(data.createdDateTime, data.modifiedDateTime, data.clientId, data.version, data.hash)
    } else {
      return new Metadata()
    }
  }

  toJSON(): object {
    return {
      createdDateTime: this.createdDateTime,
      modifiedDateTime: this.modifiedDateTime,
      clientId: this.clientId,
      version: this.version,
      hash: this.hash
    }
  }

}
