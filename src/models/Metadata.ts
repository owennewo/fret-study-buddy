export class Metadata {
  project: string
  createdDateTime: Date
  modifiedDateTime?: Date
  clientId: string
  version?: number
  hash?: string

  constructor(project: string = 'scratch', createdDateTime = new Date(), modifiedDateTime = new Date(), clientId: string = '', version: number = 0, hash: string = '') {
    this.project = project
    this.createdDateTime = createdDateTime
    this.modifiedDateTime = modifiedDateTime
    this.clientId = clientId
    this.version = version
    this.hash = hash
  }

  static fromJSON(data: any): Metadata {
    if (data) {
      return new Metadata(data.project, data.createdDateTime, data.modifiedDateTime, data.clientId, data.version, data.hash)
    } else {
      return new Metadata()
    }
  }

  toJSON(): object {
    return {
      project: this.project,
      createdDateTime: this.createdDateTime,
      modifiedDateTime: this.modifiedDateTime,
      clientId: this.clientId,
      version: this.version,
      hash: this.hash
    }
  }

}
