import { Score } from '@/models/Score'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
import { openDB, type IDBPDatabase } from 'idb'

export const useIndexedDBStore = defineStore('indexedDBStore', () => {
  const projects: Ref<Array<string>> = ref([])
  const scores: Ref<Array<ScoreLite>> = ref([])

  type ScoreLite = { id: number; title: string }

  const SCORES_STORE = 'Scores'

  let db: IDBPDatabase<unknown> | null = null

  const hasProject = async (name: string): Promise<boolean> => {
    const found = (await indexedDB.databases()).filter(dbs => dbs.name === name)

    return found.length > 0
  }

  const loadProjects = async () => {
    if (indexedDB.databases) {
      projects.value = (await indexedDB.databases()).filter(db => db.name !== 'appDatabase').map(db => db.name) as []
    } else {
      console.warn('indexedDB.databases() not supported in this browser.')
    }
  }

  const loadProject = async (projectName: string) => {
    if (await hasProject(projectName)) {
      db = await openDB(projectName)
      // return db
      await loadScores()
      console.log('loaded project:', projectName)
      return projectName
    } else {
      return null
    }
  }

  const createProject = async (projectName: string) => {
    db = await openDB(projectName, undefined, {
      upgrade(db) {
        db.createObjectStore(SCORES_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        })
      },
    })
    // project.value = projectName
    loadProjects()
  }

  const deleteProject = async (projectName: string) => {
    await indexedDB.deleteDatabase(projectName)
    await loadProjects()
  }

  const loadScores = async () => {
    if (db == null) {
      console.warn('No database selected, cannot list scores')
      return
    }

    const titles = await db?.getAll(SCORES_STORE)
    console.log('loaded scores:', titles.length)
    scores.value = titles.map(score => ({
      id: score.id,
      title: score.title,
    })) as []
  }

  const loadScore = async (scoreId: number) => {
    if (!scoreId || !db) {
      return null
    }

    const fetchedScore = await db.get(SCORES_STORE, scoreId)
    if (!fetchedScore) {
      console.warn('Score not found:', scoreId)
      return null
    }
    console.log('loaded score:', scoreId, '-', fetchedScore?.title)
    return Score.fromJSON(fetchedScore)
  }

  const saveScore = async (score: Score) => {
    const clonedScore = score.clone(true)

    if (!db) return

    if (clonedScore.id) {
      await db.put(SCORES_STORE, clonedScore)
    } else {
      const newId = await db.add(SCORES_STORE, clonedScore, undefined)
      score.id = newId as number
    }
    await loadScores()
    return score.id
  }

  // Delete a score in the selected project
  const deleteScore = async (scoreId: number) => {
    if (!db) return
    await db.delete(SCORES_STORE, scoreId)
    await loadScores()
  }

  return {
    projects,
    scores,
    // score,
    loadProjects,
    loadProject,
    createProject,
    deleteProject,
    loadScores,
    loadScore,
    saveScore,
    deleteScore,
  }
})
