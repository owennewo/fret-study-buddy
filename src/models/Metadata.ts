export class Metadata {
  project: string
  id?: string | null
  title: string
  createdDateTime: Date
  modifiedDateTime?: Date
  clientId: string
  version?: number
  hash?: string

  constructor(id: string | null = null, title: string = 'Untitled', project: string = 'scratch', createdDateTime = new Date(), modifiedDateTime = new Date(), clientId: string = '', version: number = 0, hash: string = '') {
    this.id = id
    this.title = title
    this.project = project
    this.createdDateTime = createdDateTime
    this.modifiedDateTime = modifiedDateTime
    this.clientId = clientId
    this.version = version
    this.hash = hash
  }

  static fromJSON(data: any): Metadata {
    console.assert(data, "data should exist")

    // if (data) {
    return new Metadata(data.id, data.title, data.project, data.createdDateTime, data.modifiedDateTime, data.clientId, data.version, data.hash)
    // } else {
    //   return new Metadata()
    // }
  }

  toJSON(): object {
    return {
      id: this.id,
      title: this.title,
      project: this.project,
      createdDateTime: this.createdDateTime,
      modifiedDateTime: this.modifiedDateTime,
      clientId: this.clientId,
      version: this.version,
      hash: this.hash
    }
  }

}
