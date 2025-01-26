import type { DataStore, Project, ScoreSummary } from '@/interfaces/DataStore'
import { Score } from '@/models/Score'
import { openDB } from 'idb'
import { useToast } from 'primevue'
import { watch } from 'vue'
import { useCursor } from '../useCursor'


const DATABASE_NAME = 'ApplicationDatabase'
const SCORES_STORE = 'Scores'
const SETTINGS_STORE = 'Settings'


export function useLocalDataStore() {


  const { projectId, projectName, scoreId, tempoPercent, isDarkMode, isPlaybackLooping, clientId } = useCursor()
  // const toast = useToast();

  watch([projectId, clientId, projectName, scoreId, tempoPercent, isDarkMode, isPlaybackLooping], () => {
    saveSettingsToDB()
  })


  const openDatabase = async () => {
    const db = await openDB(DATABASE_NAME, 4, {

      upgrade(db) {
        debugger
        if (!db.objectStoreNames.contains(SCORES_STORE)) {
          db.createObjectStore(SCORES_STORE, {
            keyPath: 'metadata.id',
          });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' })
        }

      },
    });
    if (!db.objectStoreNames.contains(SCORES_STORE)) {
      throw new Error(`Object store ${SCORES_STORE} does not exist in database`);
    }
    return db;
  };

  const loadSettingsFromDB = async () => {

    const db = await openDatabase()
    const settings = await db.get(SETTINGS_STORE, DATABASE_NAME)

    const savedProjectId = settings?.projectId ?? ''
    const savedProjectName = settings?.projectName ?? ''
    const savedScoreId = settings?.scoreId ?? ''

    clientId.value = settings?.clientId ?? crypto.randomUUID()
    tempoPercent.value = settings?.tempoPercent ?? 100
    isDarkMode.value = settings?.isDarkMode ?? false
    isPlaybackLooping.value = settings?.isPlaybackLooping ?? false

    projectId.value = savedProjectId
    projectName.value = savedProjectName
    scoreId.value = savedScoreId
    db.close()
  }

  const saveSettingsToDB = async () => {
    const db = await openDatabase()
    const settings = {
      id: DATABASE_NAME,
      // projectType: projectType.value,
      projectId: projectId.value,
      clientId: clientId.value,
      projectName: projectName.value,
      scoreId: scoreId.value,
      tempoPercent: tempoPercent.value,
      isDarkMode: isDarkMode.value,
      isPlaybackLooping: isPlaybackLooping.value,
    }
    await db.put(SETTINGS_STORE, settings)
  }


  return {


    loadSettingsFromDB,
    saveSettingsToDB,


    listProjects: async () => {
      return (await indexedDB.databases())
        .filter(db => db.name !== 'appDatabase')
        .map(db => ({
          id: db.name,
          name: db.name,
        })) as Project[]
    },

    listScores: async () => {
      const db = await openDatabase()
      const titles = await db?.getAll(SCORES_STORE)
      return titles.map(score => score.metadata)
    },

    getScore: async (scoreId: string) => {
      const db = await openDatabase()
      if (!db.objectStoreNames.contains(SCORES_STORE)) {
        const objectStore = db.createObjectStore(SCORES_STORE, { keyPath: 'id' });

        objectStore.createIndex('metadata_id', 'metadata.id', { unique: true });
      }

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
        await db.add(SCORES_STORE, clonedScore)
      }
      return score.metadata!
    },

    syncScore: async (score: Score) => {
      // do nothing
    }

  }
}
