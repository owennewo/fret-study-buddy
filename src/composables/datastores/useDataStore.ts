import type { DataStore } from "@/interfaces/DataStore"
import { useGDriveDataStore } from "./useGDriveDataStore"
import { useLocalDataStore } from "./useLocalDataStore"
import { computed, toRaw } from "vue"
import { useCursor } from "../useCursor"
import type { Score } from "@/models/Score"
import type { Metadata } from "@/models/Metadata"

const localDataStore = useLocalDataStore()
const griveDataStore = useGDriveDataStore()
const { clientId } = useCursor()


export function useDataStore() {

  const hashJson = async (json) =>
    Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json))))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

  const merge = (localScores, remoteScores) => {
    const combined = new Map()
    if (localScores) {
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
        } else if (value.local.version < value.remote.version) {
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
      } else if (value.local) {
        value.local.isLatest = true
        value.remote = {
          isLatest: false
        }
        value.latest = value.local
      } else if (value.remote) {
        value.local = {
          isLatest: false
        }
        value.remote.isLatest = true
        value.latest = value.remote
      } else {
        console.error("Merge error: This should never happen")
      }
    })
    return combined as Map<string, { local: Metadata, remote: Metadata, latest: Metadata }>;
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
    },
    getLocal: async (metadata: Metadata) => {
      return await localDataStore.getScore(metadata)
    },
    getRemote: async (metadata: Metadata) => {
      return await griveDataStore.getScore(metadata)
    },

    saveLocal: async (score: Score, force: boolean = false) => {
      // we want to hash the score without the metadata as this can have
      // unimportant data that would otherwise change the hash

      const exists = await localDataStore.hasScore(toRaw(score!.metadata!.id!))

      const oldVersion = score.metadata!.version
      const oldModifiedDateTime = score.metadata!.modifiedDateTime
      const oldHash = score.metadata!.hash

      if (exists) {
        delete score.metadata!.modifiedDateTime
        delete score.metadata!.version
        delete score.metadata!.hash
      }
      const scoreText = JSON.stringify(score.toJSON())
      const hash = await hashJson(scoreText)
      console.log(JSON.stringify(score.toJSON(), null, 2))
      if (exists && hash == oldHash && !force) {
        console.log("Nothing has changed, don't save")
        score.metadata!.modifiedDateTime = oldModifiedDateTime
        score.metadata!.version = oldVersion
        score.metadata!.hash = oldHash
        return score.metadata!
      }
      if (exists) {
        if (score.metadata!.clientId == clientId.value) {
          score.metadata!.version = oldVersion! + 1
        } else {
          score.metadata!.version = oldVersion!
        }
        score.metadata!.modifiedDateTime = new Date()
        score.metadata!.hash = hash
        score.metadata!.clientId = clientId.value
      }

      return await localDataStore.saveScore(score)
    },

    saveRemote: async function (score) {
      await griveDataStore.saveScore(score)
    },

    deleteLocal: async (id: string) => {
      await localDataStore.deleteScore(id)
    },


    deleteRemote: async (googleId: string) => {
      await griveDataStore.deleteScore(googleId)
    },
    resetRemote: async () => {
      const files = await griveDataStore.listScores()
      files.forEach(async file => {
        await griveDataStore.deleteScore(file.googleId)
      })
    },
  }
}
