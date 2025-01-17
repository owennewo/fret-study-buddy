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
    createProject: async (projectName: string) => {
      return await ds.value.createProject(projectName)
    },
    deleteProject: async (projectId: string) => {
      return await ds.value.deleteProject(projectId)
    },
    listScores: async (projectId: string) => {
      return await ds.value.listScores(projectId)
    },
    getScore: async (projectId: string, scoreId: string) => {
      return await ds.value.getScore(projectId, scoreId)
    },
    saveScore: async (projectId: string, score: Score) => {
      // we want to hash the score without the metadata as this can have
      // unimportant data that would otherwise change the hash
      const metadata = score.metadata;
      delete score.metadata
      const scoreText = JSON.stringify(score)
      const hash = await hashJson(scoreText)
      if (hash == metadata?.hash) {
        console.log("Nothing has changed, don't save")
        score.metadata = metadata
        return {
          id: score.id!.toString(),
          title: score.title,
        } as ScoreSummary
      }
      console.log('hash', hash, metadata?.hash)
      metadata!.hash = hash
      metadata!.clientId = clientId.value
      metadata!.version +=1
      score.metadata = metadata
      return await ds.value.saveScore(projectId, score)
    },
    deleteScore: async (projectId: string, scoreId: string) => {
      return await ds.value.deleteScore(projectId, scoreId)
    },
    exportProject: async (projectId: string) => {
      return await ds.value.exportProject(projectId)
    },
    importProject: async (projectName: string, projectBlob: Blob) => {
      return await ds.value.importProject(projectName, projectBlob)
    },
  }
}
