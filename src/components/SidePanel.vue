<script setup lang="ts">
import { useCanvas } from '@/composables/useCanvas'

import { useCursor } from '@/composables/useCursor'
import { Technique } from '@/models/Note'
import { Score } from '@/models/Score'
import { useSettingsStore } from '@/stores/settingsStore'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import { computed, onMounted, ref, toRefs, watch } from 'vue'
import { instruments } from '@/models/Instruments'
import { BaseNoteValue } from '@/models/Duration'

const { projects, scores } = toRefs(useIndexedDBStore())
const { project, score, scoreId, track, bar, voice, voiceId, element, note, mode } = useCursor()

const { createProject, loadProjects, loadProject, loadScore, saveScore, deleteScore } = useIndexedDBStore()
const { saveSettingsToDB, loadSettingsFromDB } = useSettingsStore()
const { voiceColours } = useCanvas()

const showAddProject = ref(false)
const newProjectName = ref('')

const activeTab = ref(0)

watch(mode, () => {
  activeTab.value = mode.value
})

// watch(score, () => {
//   console.log('#######', score.value, score.value?.id, score.value?.title)
//   // currentScoreId.value = score.value?.id ?? -1
// })

watch(project, async () => {
  if (project.value) {
    console.log('switching project:', project.value)
    loadProject(project.value)
    saveSettingsToDB()
  }
})

watch(scoreId, async newCurrentScoreId => {
  if (project.value == null || newCurrentScoreId == undefined || newCurrentScoreId <= 0) {
    return
  }
  console.log('Current Score:', newCurrentScoreId)
  if (newCurrentScoreId != null) {
    const loadedScore = await loadScore(project.value, newCurrentScoreId)
    console.log('Loaded Score:', score.value)
    score.value = loadedScore as Score
    saveSettingsToDB()
  }
})

const addProjectClicked = () => {
  console.log('Adding New Project:', newProjectName.value)
  showAddProject.value = false
  createProject(newProjectName.value)
  newProjectName.value = ''
}

const showAddProjectDialog = () => {
  showAddProject.value = true
}

const deleteScoreClicked = async () => {
  if (score.value?.id == null) {
    return
  }
  await deleteScore(score.value?.id)
  score.value = Score.new()
  scoreId.value = -1
}

const saveScoreClicked = async () => {
  await saveScore(score.value)
}

const newScore = async () => {
  console.log('New Score')
  score.value = Score.new()
  const id = await saveScore(score.value)
  scoreId.value = id as number
  saveSettingsToDB()
}

const instrumentOptions = computed(() => Object.keys(instruments))

const baseDurationOptions = computed(() => {
  return Object.keys(BaseNoteValue)
    .filter(key => isNaN(Number(key))) // Exclude numeric reverse mapping if TypeScript emits it
    .map(key => ({
      label: key,
      value: BaseNoteValue[key as keyof typeof BaseNoteValue],
    }))
})

const tuningOptions = instrumentName => {
  if (!instrumentName) return []
  return Object.keys(instruments[instrumentName].tunings)
}

const toneOptions = instrumentName => {
  if (!instrumentName) return []
  return Object.keys(instruments[instrumentName].tones)
}

const addTrack = () => {
  score.value.addTrack()
}

const removeTrack = index => {
  if (score.value._tracks.length > 1) {
    score.value._tracks.splice(index, 1)
  }
}

onMounted(async () => {
  await loadProjects()
  await loadSettingsFromDB()
})

const techniqueList = () => {
  const t = Object.entries(Technique).map(([name, key]) => {
    return {
      key: key as string,
      name,
    }
  })
  // debugger
  return t
}
</script>
<template>
  <aside class="middle-column">
    <p-accordion :value="activeTab">
      <p-accordionpanel v-if="score" :value="0">
        <p-accordionheader>Score</p-accordionheader>
        <p-accordioncontent class="vertically-spaced">
          <p-floatlabel variant="on">
            <p-select
              v-model="project"
              :options="projects"
              inputId="project"
              placeholder="Select a Project"
              class="w-full md:w-56"
            >
              <template #dropdownicon>
                <i class="pi pi-book" />
              </template>
              <template #header>
                <div class="font-medium p-3">Available Projects</div>
              </template>
              <template #footer>
                <div class="p-3">
                  <p-button
                    label="Add New"
                    @click="showAddProjectDialog"
                    fluid
                    severity="secondary"
                    text
                    size="small"
                    icon="pi pi-plus"
                  />
                </div>
              </template>
            </p-select>
            <label for="project">Project</label>
          </p-floatlabel>
          <p-floatlabel variant="on">
            <p-inputgroup inputId="score">
              <p-select
                v-model="scoreId"
                :options="scores"
                optionLabel="title"
                optionValue="id"
                placeholder="Select a score"
                class="w-full md:w-56"
              >
                <template #header>
                  <div class="font-medium p-3">Available Scores</div>
                </template>
                <template #footer>
                  <div class="p-3">
                    <p-button
                      label="Add New"
                      @click="newScore"
                      fluid
                      severity="secondary"
                      text
                      size="small"
                      icon="pi pi-plus"
                    />
                  </div>
                </template>
              </p-select>
              <p-inputgroupaddon>
                <p-button icon="pi pi-trash" severity="secondary" @click="deleteScoreClicked"></p-button>
                <p-button icon="pi pi-save" severity="secondary" @click="saveScoreClicked"></p-button>
              </p-inputgroupaddon>
            </p-inputgroup>
            <label for="score">Score</label>
          </p-floatlabel>

          <p-floatlabel variant="on">
            <p-inputtext v-model="score.title" inputId="title" variant="filled" />
            <label for="title">Title</label>
          </p-floatlabel>
          <p-floatlabel variant="on">
            <p-inputtext v-model="score.url" inputId="url" variant="filled" style="width: 200px" />
            <a v-if="score.url" :href="score.url" target="_blank" class="p-button-icon" style="float: right">
              <i class="pi pi-external-link"></i>
            </a>
            <label for="url">Url</label>
          </p-floatlabel>

          <p-floatlabel variant="on">
            <p-inputnumber v-model="score.tempo" inputId="tempo" variant="filled" :min="1" :step="5" showButtons />
            <label for="tempo">Tempo</label>
          </p-floatlabel>
          <p-floatlabel variant="on">
            <p-inputnumber v-model="score.barsPerLine" id="barsPerLine" variant="filled" :min="1" showButtons />
            <label for="barsPerLine">Bars per Line</label>
          </p-floatlabel>
          <p-floatlabel variant="on">
            <p-inputnumber v-model="score.fontSize" id="fontSize" :min="4" showButtons :step="2" variant="filled" />
            <label for="fontSize">Font size</label>
          </p-floatlabel>

          <p-floatlabel variant="on">
            <p-inputgroup>
              <p-inputnumber
                v-model="score.timeSignature.beatsPerBar"
                placeholder="Beats per Bar"
                :min="1"
                showButtons
                class="small"
                variant="filled"
              />
              <p-inputnumber
                v-model="score.timeSignature.beatValue"
                placeholder="Beat Value"
                :min="1"
                showButtons
                class="small"
                variant="filled"
              />
            </p-inputgroup>

            <label>Time Signature</label>
          </p-floatlabel>

          <p-tabs :value="0">
            <p-tablist>
              <p-tab v-for="(track, index) in score._tracks" :key="index" :value="index">Track {{ index }}</p-tab>
              <p-tab :value="1">
                <p-button icon="pi pi-plus" class="p-button-text add-track-icon" @click="addTrack" />
              </p-tab>
            </p-tablist>
            <p-tabpanels>
              <p-tabpanel v-for="(track, index) in score._tracks" :key="index" :value="index" class="vertically-spaced">
                <p-floatlabel variant="on">
                  <p-select
                    v-model="track.instrument.instrumentName"
                    :options="instrumentOptions"
                    inputId="instrument"
                    :id="'instrument-' + index"
                    placeholder="Select Instrument"
                  />
                  <label for="instrument">Instrument</label>
                </p-floatlabel>
                <p-floatlabel variant="on">
                  <p-select
                    v-model="track.instrument.tuningName"
                    :options="tuningOptions(track.instrument.instrumentName)"
                    :id="'tuning-' + index"
                    placeholder="Select Tuning"
                  />
                  <label :for="'tuning-' + index">Tuning</label>
                </p-floatlabel>
                <p-floatlabel variant="on">
                  <p-select
                    v-model="track.instrument.toneName"
                    :options="toneOptions(track.instrument.instrumentName)"
                    :id="'tone-' + index"
                    placeholder="Select Tone"
                  />
                  <label :for="'tone-' + index">Tone</label>
                </p-floatlabel>
              </p-tabpanel>
              <p-tabpanel :value="score._tracks.length"> </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
        </p-accordioncontent>
      </p-accordionpanel>
      <p-accordionpanel v-if="note" :value="1">
        <p-accordionheader>Note {{ note?.index() + 1 }} / {{ element!._notes.length }} </p-accordionheader>
        <p-accordioncontent>
          <div class="field">
            <label>Time Signature</label>

            <div v-if="bar" class="field-group">
              <p-inputnumber
                v-model="bar.timeSignature.beatsPerBar"
                placeholder="Beats per Bar"
                :min="1"
                showButtons
                class="small"
              />
              <span>&nbsp;/&nbsp;</span>
              <p-inputnumber
                v-model="bar.timeSignature.beatValue"
                placeholder="Beat Value"
                :min="1"
                showButtons
                class="small"
              />
            </div>
          </div>

          <p-floatlabel variant="on">
            <p-select
              v-model="element.duration.baseDuration"
              :options="baseDurationOptions"
              optionLabel="label"
              optionValue="value"
              inputId="baseUnit"
              placeholder="Base Unit"
              class="w-full"
            >
            </p-select>

            <label for="duration">Duration</label>
          </p-floatlabel>
          <p-floatlabel variant="on">
            <p-inputnumber
              v-model="element.duration.dotCount"
              inputId="dotCount"
              variant="filled"
              :min="0"
              :max="2"
              :step="1"
              showButtons
            />
            <label for="dotCount">dotCount</label>
          </p-floatlabel>
          <p-floatlabel variant="on">
            <p-checkbox v-model="element.duration.isTriplet" binary inputId="isTriplet" />
            <label for="isTriplet">isTriplet</label>
          </p-floatlabel>

          <p-inputnumber v-model="note.fretNumber" placeholder="Duration" showButtons class="small" />
          <p-inputnumber v-model="note.leftHandFinger" placeholder="leftHandFinger" showButtons class="small" />
          <p-inputnumber v-model="note.rightHandFinger" placeholder="rightHandFinger" showButtons class="small" />

          <p-multiselect
            v-model="note.techniques"
            :options="techniqueList()"
            optionLabel="name"
            optionValue="key"
            inputId="techniqueSelect"
            placeholder="Select Techniques"
            display="chip"
            :showToggleAll="false"
            class="w-full"
          >
          </p-multiselect>

          <!-- <div v-for="technique of techniqueList()" :key="technique.key" class="flex items-center gap-2">
              <p-checkbox v-model="note.techniques" :inputId="technique.key" name="category" :value="technique.key" />
              <label :for="technique.key">{{ technique.name }}</label>
            </div> -->
        </p-accordioncontent>
      </p-accordionpanel>
    </p-accordion>
  </aside>

  <p-dialog v-model:visible="showAddProject" modal header="Add Project" :style="{ width: '25rem' }">
    <span class="text-surface-500 dark:text-surface-400 block mb-8">
      You will be able to add new tabs to this project.
    </span>
    <div class="flex items-center gap-4 mb-4">
      <label for="newProjectName" class="font-semibold w-24">Project Name</label>
      <p-inputtext id="newProjectName" v-model="newProjectName" class="flex-auto" autocomplete="off" />
    </div>
    <div class="flex justify-end gap-2">
      <p-button type="button" label="Cancel" severity="secondary" @click="showAddProject = false" />
      <p-button type="button" label="Save" @click="addProjectClicked" />
    </div>
  </p-dialog>
</template>
<style scoped>
.small input {
  width: 8ch;
}

.voice-1 {
  color: var(--voice-1-color);
}

button.p-togglebutton-checked .voice-1 {
  background-color: var(--voice-1-color);
  color: white;
}

.voice-2 {
  color: var(--voice-2-color);
}

.voice-3 {
  color: var(--voice-3-color);
}

div.vertically-spaced,
div.vertically-spaced > * {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.middle-column {
  display: block;
  transition: width 0.3s ease;
  overflow: hidden;
}

body.sidebar-closed .middle-column {
  /* display: none; */
  width: 0px;
  padding: 0px;
}
</style>
