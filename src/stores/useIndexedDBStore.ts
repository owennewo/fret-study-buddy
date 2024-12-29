import { Score } from '@/models/Score'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
import { openDB, type IDBPDatabase } from 'idb'
import JSZip from 'jszip'

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

  const loadScore = async (project: string, scoreId: number) => {
    if (!db || db.name !== project) {
      await loadProject(project)
    }

    if (!scoreId || !db) {
      return null
    }

    const fetchedScore = await db.get(SCORES_STORE, scoreId)
    if (!fetchedScore) {
      console.warn('Score not found:', scoreId)
      return null
    }
    console.log('loaded score:', scoreId, '-', fetchedScore?.title)
    console.log(fetchedScore)
    return Score.fromJSON(fetchedScore)
  }

  const saveScore = async (score: Score) => {
    const clonedScore = score.clone(true)
    console.log('saving score:', clonedScore)

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

  const exportProject = async (projectName: string): Promise<Blob | null> => {
    if (!projectName) return null

    db = await openDB(projectName)
    if (!db) {
      console.warn('Project not found:', projectName)
      return null
    }

    const exportData = {
      scores: await db.getAll(SCORES_STORE),
    }

    const zip = new JSZip()
    zip.file(`${projectName}.json`, JSON.stringify(exportData))

    return await zip.generateAsync({ type: 'blob' })
  }

  const downloadExportedProject = async (projectName: string) => {
    const blob = await exportProject(projectName)
    if (!blob) {
      console.warn('Export failed for project:', projectName)
      return
    }

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${projectName}.zip`
    link.click()
    console.log('Project exported successfully:', projectName)
  }

  const importProject = async (file: File) => {
    if (!file) {
      console.warn('No file selected for import')
      return
    }

    const zip = new JSZip()
    const fileContents = await file.arrayBuffer()
    const unzipped = await zip.loadAsync(fileContents)

    const jsonFileName = Object.keys(unzipped.files).find(name => name.endsWith('.json'))
    if (!jsonFileName) {
      console.warn('No JSON file found in zip')
      return
    }

    const jsonData = await unzipped!.file(jsonFileName)!.async('string')
    const importData = JSON.parse(jsonData)

    const projectName = jsonFileName.replace('.json', '')
    await createProject(projectName)

    if (!db || db.name !== projectName) {
      db = await openDB(projectName)
    }

    if (importData.scores) {
      const tx = db.transaction(SCORES_STORE, 'readwrite')
      for (const score of importData.scores) {
        await tx.store.put(score)
      }
      await tx.done
    }

    console.log('Project imported successfully:', projectName)
    await loadProjects()
  }

  const importProjectFromUrl = async (url: string) => {
    if (!url) {
      console.warn('No URL provided for import')
      return
    }

    const response = await fetch(url)
    const blob = await response.blob()
    await importProject(new File([blob], 'imported.zip'))
    console.log('Project imported successfully from URL:', url)
  }

  return {
    projects,
    scores,
    loadProjects,
    loadProject,
    createProject,
    deleteProject,
    loadScores,
    loadScore,
    saveScore,
    deleteScore,
    exportProject,
    downloadExportedProject,
    importProject,
    importProjectFromUrl,
  }
})
