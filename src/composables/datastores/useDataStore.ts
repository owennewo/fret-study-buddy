import type { DataStore, ScoreSummary } from "@/interfaces/DataStore"
import { useGDriveDataStore } from "./useGDriveDataStore"
import { useLocalDataStore } from "./useLocalDataStore"
import { computed } from "vue"
import { useCursor } from "../useCursor"
import type { Score } from "@/models/Score"

const localDataStore = useLocalDataStore()
const griveDataStore = useGDriveDataStore()
const { projectType, clientId } = useCursor()


export function useDataStore(): DataStore {

  const ds = computed((): DataStore=> {
    if (projectType.value == 'GDrive') {
      return griveDataStore
    } else {
      return localDataStore
    }
  })

  const hashJson = async (json) =>
    Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json))))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');


  return {
    listProjects: async () => {
      return await ds.value.listProjects()
    },
    // createProject: async (projectName: string) => {
    //   return await ds.value.createProject(projectName)
    // },
    // deleteProject: async (projectId: string) => {
    //   return await ds.value.deleteProject(projectId)
    // },
    listScores: async () => {
      return await ds.value.listScores()
    },
    getScore: async (scoreId: string) => {
      return await ds.value.getScore(scoreId)
    },
    saveScore: async (score: Score) => {
      // we want to hash the score without the metadata as this can have
      // unimportant data that would otherwise change the hash

      const oldVersion = score.metadata!.version
      const oldModifiedDateTime = score.metadata!.modifiedDateTime
      const oldHash = score.metadata!.hash
      delete score.metadata!.modifiedDateTime
      delete score.metadata!.version
      delete score.metadata!.hash

      const scoreText = JSON.stringify(score.toJSON())
      const hash = await hashJson(scoreText)
      console.log(scoreText)
      if (hash == oldHash) {
        console.log("Nothing has changed, don't save")
        score.metadata!.modifiedDateTime = oldModifiedDateTime
        score.metadata!.version = oldVersion
        score.metadata!.hash = oldHash
        return score.metadata!
      }
      score.metadata!.modifiedDateTime = new Date()
      score.metadata!.hash = hash
      score.metadata!.clientId = clientId.value
      score.metadata!.version = oldVersion! + 1

      //deleteme
      // score.metadata!.id = score!.id!
      // score.metadata!.title = score.title
      return await ds.value.saveScore(score)
    },
    syncScore: async (score: Score) => {
      const localVerion = score.metadata?.version
      const localClientId = score.metadata?.clientId
      console.log(`checking ${score.metadata!.id} ${localVerion} ${localClientId}`)
    },
    deleteScore: async (scoreId: string) => {
      return await ds.value.deleteScore(scoreId)
    },
    // exportProject: async () => {
    //   return await ds.value.exportProject()
    // },
    // importProject: async (projectName: string, projectBlob: Blob) => {
    //   return await ds.value.importProject(projectName, projectBlob)
    // },
  }
}
