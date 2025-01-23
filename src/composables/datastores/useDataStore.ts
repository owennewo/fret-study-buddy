import type { DataStore } from "@/interfaces/DataStore"
import { useGDriveDataStore } from "./useGDriveDataStore"
import { useLocalDataStore } from "./useLocalDataStore"
import { computed } from "vue"
import { useCursor } from "../useCursor"
import type { Score } from "@/models/Score"

const localDataStore = useLocalDataStore()
const griveDataStore = useGDriveDataStore()
const { projectType, clientId } = useCursor()


export function useDataStore() {

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

  const merge = (localScores, remoteScores) => {
    const combined = new Map()
    if (localScores)  {
      localScores.forEach(score => {
        combined.set(score.id, {
          local: score,
          remote: null,
        })
      })
    }

    if (remoteScores) {
      remoteScores.forEach(score => {
        if (combined.has(score.id)) {
          combined.get(score.id).remote = score
        } else {
          combined.set(score.id, {
            local: null,
            remote: score,
          })
        }
      })
    }

    combined.forEach((value, key) => {
      if (value.local && value.remote) {
        if (value.local.version > value.remote.version) {
          value.local.isLatest = true
          value.remote.isLatest = false
          value.latest = value.local
          if (value.local.clientId != value.remote.clientId) {
            value.remote.clientMismatch = true
          }
          if (value.local.version < value.remote.version) {
            value.remote.isLatest = true
            value.local.isLatest = false
            value.latest = value.remote
            if (value.local.clientId != value.remote.clientId) {
              value.local.clientMismatch = true
            }
          } else {
            // same versio
            value.local.isLatest = true
            value.remote.isLatest = true
            value.latest = value.local
            if (value.local.clientId != value.local.clientId) {
              value.local.clientMismatch = true
              value.remote.clientMismatch = true
            }
          }
        }
      }  else if (value.local) {
        value.local.isLatest = true
        value.remote = {
          isLatest: false
        }
        value.latest = value.local
      } else if (value.remote){
        value.local = {
          isLatest: false
        }
        value.remote.isLatest = true
        value.latest = value.remote
      } else {
        console.error("Merge error: This should never happen")
      }
    })

    return combined;

  }

  return {
    listScores: async (fetchLocal = true, fetchRemote = false) => {
      if (fetchLocal && fetchRemote) {
        const localScores = await localDataStore.listScores()
        const remoteScores = await griveDataStore.listScores()
        return merge(localScores, remoteScores)
      } else if (fetchLocal) {
        const localScores = await localDataStore.listScores()
        return merge(localScores, null)
      } else if (fetchRemote) {
        const remoteScores = await griveDataStore.listScores()
        return merge(null, remoteScores)
      }

      return await ds.value.listScores()
    },
    getScore: async (scoreId: string) => {
      return await ds.value.getScore(scoreId)
    },
    saveScore: async (score: Score, remote: boolean = true) => {
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

      if (remote) {
        return await griveDataStore.saveScore(score)
      } else {
        return await localDataStore.saveScore(score)
      }
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
