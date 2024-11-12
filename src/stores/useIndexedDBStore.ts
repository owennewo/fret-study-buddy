import { MusicalScore } from '@/models/MusicalScore'
import { defineStore } from 'pinia'
import { watch, ref, type Ref } from 'vue'
import { openDB, type IDBPDatabase } from 'idb'
import { useSettings } from '@/composables/useSettings'

export const useIndexedDBStore = defineStore('indexedDBStore', () => {
  const projectNames: Ref<Array<string>> = ref([]) // List of all databases
  const scoreTitles = ref([]) // List of titles in the selected project
  const score: Ref<MusicalScore | null> = ref(null)

  const { currentProjectName, currentScoreId } = useSettings()

  const SCORES_STORE = 'Scores'

  let db: IDBPDatabase<unknown> | null = null

  watch([currentProjectName, currentScoreId], async () => {
    console.log('switching project:', currentProjectName.value)

    if (await hasDatabase(currentProjectName.value)) {
      db = await openDB(currentProjectName.value)
      console.log('Database opened:', db)
      await listScores()
      await loadScore()
    } else {
      console.log('No database found')
      currentProjectName.value = ''
      currentScoreId.value = 0
    }
  })

  // watch(currentScoreId, async () => {
  //   console.log('switching score:', currentScoreId.value)
  // })

  const hasDatabase = async (name: string): Promise<boolean> => {
    const found = (await indexedDB.databases()).filter(dbs => dbs.name === name)

    return found.length > 0
  }

  const listProjects = async () => {
    if (indexedDB.databases) {
      projectNames.value = (await indexedDB.databases())
        .filter(db => db.name !== 'appDatabase')
        .map(db => db.name)
    } else {
      console.warn('indexedDB.databases() not supported in this browser.')
    }
  }

  // Add a new project (database)
  const addProject = async (projectName: string) => {
    db = await openDB(projectName, undefined, {
      upgrade(db) {
        db.createObjectStore(SCORES_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        })
      },
    })
    currentProjectName.value = projectName
    listProjects()
  }

  // Delete a project (database)
  const deleteProject = async projectName => {
    await indexedDB.deleteDatabase(projectName)
    if (project.value === projectName) {
      project.value = null
      scoreTitles.value = []
      score.value = null
    }
    await listProjects()
  }

  const loadScore = async () => {
    if (currentScoreId.value < 1) {
      return null
    }
    const fetchedScore = await db.get(SCORES_STORE, currentScoreId.value)
    debugger
    score.value = MusicalScore.fromJSON(fetchedScore)
    return score
    // return db.get(SCORES_STORE, currentScoreId.value)
  }

  const listScores = async () => {
    if (db == null) {
      console.warn('No database selected, cannot list scores')
      return
    }

    const titles = await db?.getAll(SCORES_STORE)
    scoreTitles.value = titles.map(score => ({
      id: score.id,
      title: score.title,
    }))
  }

  const upsertScore = async () => {
    const clonedScore = score.value.clone(true)

    if (clonedScore.id) {
      await db.put(SCORES_STORE, clonedScore)
    } else {
      const newId = await db.add(SCORES_STORE, clonedScore, undefined)
      debugger
      currentScoreId.value = newId as number
    }
    await listScores()
  }

  // Delete a score in the selected project
  const deleteScore = async () => {
    await db.delete(SCORES_STORE, currentScoreId.value)
    currentScoreId.value = 0
    score.value = null
    await listScores()
  }

  const newScore = () => {
    console.log('Show Add New Score')
    score.value = MusicalScore.new()

    currentScoreId.value = 0
    upsertScore()
  }

  return {
    projectNames,
    scoreTitles,
    score,
    listProjects,
    addProject,
    // renameProject,
    deleteProject,
    listScores,
    loadScore,
    upsertScore,
    deleteScore,
    newScore,
    // renameScore,
  }
})
