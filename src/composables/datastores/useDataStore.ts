import type { DataStore } from "@/interfaces/DataStore"
import { useGDriveDataStore } from "./useGDriveDataStore"
import { useLocalDataStore } from "./useLocalDataStore"
import { computed } from "vue"
import { useCursor } from "../useCursor"
import type { Score } from "@/models/Score"

const localDataStore = useLocalDataStore()
const griveDataStore = useGDriveDataStore()
const { projectType } = useCursor()


export function useDataStore(): DataStore {

  const ds = computed((): DataStore=> {
    if (projectType.value == 'GDrive') {
      return griveDataStore
    } else {
      return localDataStore
    }
  })

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
