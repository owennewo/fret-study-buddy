import type { DataStore, Project, ScoreSummary } from '@/interfaces/DataStore'
import { Score } from '@/models/Score'
import { openDB } from 'idb'


const DATABASE_NAME = 'ApplicationDatabase'
const SCORES_STORE = 'Scores'
const SETTINGS_STORE = 'Settings'


export function useLocalDataStore(): DataStore {

  const openDatabase = async (projectId: string, version: number = 1) => {

    const db = await openDB(projectId, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SCORES_STORE)) {
          db.createObjectStore(SCORES_STORE, {
            keyPath: 'id',
          });
        }
      },
    });
    if (!db.objectStoreNames.contains(SCORES_STORE)) {
      throw new Error(`Object store ${SCORES_STORE} does not exist in database ${projectId}`);
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
    createProject: async projectName => {
      await openDatabase(projectName)
      return { id: projectName, name: projectName } as Project
    },
    deleteProject: async projectId => {
      const result = await indexedDB.deleteDatabase(projectId)
      console.log(result)
    },
    listScores: async projectId => {
      const db = await openDatabase(projectId,1)
      const titles = await db?.getAll(SCORES_STORE)
      return titles.map(score => ({
        id: score.id,
        title: score.title,
      })) as ScoreSummary[]
    },
    getScore: async (projectId: string, scoreId: string) => {
      const db = await openDatabase(projectId)
      const fetchedScore = await db.get(SCORES_STORE, scoreId)
      if (!fetchedScore) {
        console.warn('Score not found:', scoreId)
        return null
      }
      return Score.fromJSON(fetchedScore)
    },
    deleteScore: async (projectId, scoreId) => {
      const db = await openDatabase(projectId)
      await db.delete(SCORES_STORE, scoreId)
    },

    saveScore: async (projectId: string, score: Score) => {
      const db = await openDatabase(DATABASE_NAME)
      const clonedScore = score.clone(true)
      console.log('saving score:', clonedScore)

      if (clonedScore.id) {
        await db.put(SCORES_STORE, clonedScore)
      } else {
        clonedScore.id = crypto.randomUUID()
        await db.add(SCORES_STORE, clonedScore, undefined)
        // score.id = newId as string
      }

      return {
        id: score.id!.toString(),
        title: score.title,
      } as ScoreSummary
    },
    exportProject: async function (projectId) {
      // throw new Error('not implemented' + projectId)
      return {} as Blob
    },
    importProject: async function (projectName, projectBlob) {
      return {} as Project
    },

    syncScore: async (projectId: string, score: Score) => {
      // do nothing
    }

  }
}
