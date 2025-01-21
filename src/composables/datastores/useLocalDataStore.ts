import type { DataStore, Project, ScoreSummary } from '@/interfaces/DataStore'
import { Score } from '@/models/Score'
import { openDB } from 'idb'


const DATABASE_NAME = 'ApplicationDatabase'
const SCORES_STORE = 'Scores'
const SETTINGS_STORE = 'Settings'


export function useLocalDataStore(): DataStore {

  const openDatabase = async () => {

    const db = await openDB(DATABASE_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SCORES_STORE)) {
          db.createObjectStore(SCORES_STORE, {
            keyPath: 'id',
          });
        }
      },
    });
    if (!db.objectStoreNames.contains(SCORES_STORE)) {
      throw new Error(`Object store ${SCORES_STORE} does not exist in database`);
    }
    return db;
  };


  return {
    listProjects: async () => {
      return (await indexedDB.databases())
        .filter(db => db.name !== 'appDatabase')
        .map(db => ({
          id: db.name,
          name: db.name,
        })) as Project[]
    },
    // createProject: async projectName => {
    //   await openDatabase(projectName)
    //   return { id: projectName, name: projectName } as Project
    // },
    // deleteProject: async projectId => {
    //   const result = await indexedDB.deleteDatabase(projectId)
    //   console.log(result)
    // },

    listScores: async () => {
      const db = await openDatabase()
      const titles = await db?.getAll(SCORES_STORE)
      return titles.map(score => score.metadata)
    },

    getScore: async (scoreId: string) => {
      const db = await openDatabase()
      const fetchedScore = await db.get(SCORES_STORE, scoreId)
      if (!fetchedScore) {
        console.warn('Score not found:', scoreId)
        return null
      }
      return Score.fromJSON(fetchedScore)
    },
    deleteScore: async (scoreId) => {
      const db = await openDatabase()
      await db.delete(SCORES_STORE, scoreId)
    },

    saveScore: async (score: Score) => {
      const db = await openDatabase()
      const clonedScore = score.clone(true)
      console.log('saving score:', clonedScore)

      if (clonedScore.metadata!.id) {
        await db.put(SCORES_STORE, clonedScore)
      } else {
        clonedScore.metadata!.id = crypto.randomUUID()
        await db.add(SCORES_STORE, clonedScore, undefined)
      }

      return score.metadata!
    },
    // exportProject: async function () {
    //   // throw new Error('not implemented' + projectId)
    //   return {} as Blob
    // },
    // importProject: async function (projectName, projectBlob) {
    //   return {} as Project
    // },

    syncScore: async (score: Score) => {
      // do nothing
    }

  }
}
