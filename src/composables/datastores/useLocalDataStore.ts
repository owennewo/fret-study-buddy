import type { DataStore, Project, ScoreSummary } from '@/interfaces/DataStore'
import { Score } from '@/models/Score'
import { openDB } from 'idb'

export function useLocalDataStore(): DataStore {
  const SCORES_STORE = 'Scores'

  const openDatabase = async (projectId: string, version: number = 1) => {
    const db = await openDB(projectId, version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SCORES_STORE)) {
          db.createObjectStore(SCORES_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      },
    });
    console.log(projectId, "storenames", await db.objectStoreNames)
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
      console.log('loaded scores:', titles.length)
      return titles.map(score => ({
        id: score.id,
        title: score.title,
      })) as ScoreSummary[]
    },
    getScore: async (projectId: string, scoreId: string) => {
      const db = await openDatabase(projectId)
      const fetchedScore = await db.get(SCORES_STORE, parseInt(scoreId))
      if (!fetchedScore) {
        console.warn('Score not found:', scoreId)
        return null
      }
      console.log('loaded score:', scoreId, '-', fetchedScore?.title)
      console.log(fetchedScore)
      return Score.fromJSON(fetchedScore) as Score
    },
    deleteScore: async (projectId, scoreId) => {
      const db = await openDatabase(projectId)
      await db.delete(SCORES_STORE, scoreId)
    },

    saveScore: async (projectId, score) => {
      const db = await openDatabase(projectId)
      score.modifiedDateTime = new Date()
      const clonedScore = score.clone(true)
      console.log('saving score:', clonedScore)

      if (clonedScore.id) {
        await db.put(SCORES_STORE, clonedScore)
      } else {
        const newId = await db.add(SCORES_STORE, clonedScore, undefined)
        score.id = newId as string
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
    }

  }
}
