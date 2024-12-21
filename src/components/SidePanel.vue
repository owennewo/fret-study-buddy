<script setup lang="ts">
import { useCursor } from '@/composables/useCursor'
import { Technique } from '@/models/NotePosition'
import { Score } from '@/models/Score'
import { useSettingsStore } from '@/stores/settingsStore'
import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import { computed, onMounted, ref, toRefs, watch } from 'vue'
import { instruments } from '@/models/Instruments'

const { projects, scores } = toRefs(useIndexedDBStore())
const { project, score, track, bar, voice, voiceId, element, note, mode } = useCursor()

const { createProject, loadProjects, loadProject, loadScore, saveScore, deleteScore } = useIndexedDBStore()
const { saveSettingsToDB, loadSettingsFromDB } = useSettingsStore()

const showAddProject = ref(false)
const newProjectName = ref('')
const currentScoreId = ref(-1)

const activeTab = ref(0)

watch(mode, () => {
  activeTab.value = mode.value
})

watch(score, () => {
  console.log('#######', score.value, score.value?.id, score.value?.title)
  currentScoreId.value = score.value?.id ?? -1
})

watch(project, async () => {
  if (project.value) {
    console.log('switching project:', project.value)
    loadProject(project.value)
    saveSettingsToDB()
  }
})

watch(currentScoreId, async newCurrentScoreId => {
  console.log('Current Score:', newCurrentScoreId)
  if (newCurrentScoreId != null) {
    const loadedScore = await loadScore(newCurrentScoreId)
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
  currentScoreId.value = -1
}

const saveScoreClicked = async () => {
  await saveScore(score.value)
}

const newScore = async () => {
  console.log('New Score')
  score.value = Score.new()
  const id = await saveScore(score.value)
  currentScoreId.value = id as number
  saveSettingsToDB()
}

const instrumentOptions = computed(() => Object.keys(instruments))

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

const voiceOptions = computed(() => {
  const options = Array.from({ length: 4 }, (_, i) => ({
    label: '' + (i + 1),
    value: i,
    class: `voice-${i}`,
  }))
  return options
})

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
    <p-selectbutton
      v-model="voiceId"
      :options="voiceOptions"
      optionLabel="label"
      optionValue="value"
      :allowEmpty="false"
    >
      <template #option="{ option }">
        <span :class="option.class">{{ option.label }}</span>
      </template>
    </p-selectbutton>

    <p-accordion :value="activeTab">
      <p-accordionpanel :value="0">
        <p-accordionheader>Open</p-accordionheader>
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
                v-model="currentScoreId"
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
        </p-accordioncontent>
      </p-accordionpanel>
      <p-accordionpanel v-if="score" :value="1">
        <p-accordionheader>Score</p-accordionheader>
        <p-accordioncontent class="vertically-spaced">
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
        </p-accordioncontent>
      </p-accordionpanel>
      <p-accordionpanel v-if="track" :value="2">
        <p-accordionheader>Track {{ track?.index() + 1 }} / {{ score._tracks.length }} </p-accordionheader>
        <p-accordioncontent>
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
                <!-- <p-floatlabel variant="on">
                  <p-inputnumber
                    v-model="track.voiceCount"
                    id="voiceCount"
                    :min="1"
                    :max="4"
                    showButtons
                    :step="1"
                    class="small"
                  />
                  <label for="voiceCount">Voice Count</label>
                </p-floatlabel> -->
              </p-tabpanel>
              <p-tabpanel :value="score._tracks.length"> </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
        </p-accordioncontent>
      </p-accordionpanel>
      <p-accordionpanel v-if="bar" :value="3">
        <p-accordionheader v-if="track">Bar {{ bar?.index() + 1 }} / {{ track._bars.length }}</p-accordionheader>
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
        </p-accordioncontent>
      </p-accordionpanel>
      <p-accordionpanel v-if="voice" :value="4">
        <p-accordionheader>Voice {{ voice?.index() + 1 }} / {{ bar!._voices.length }} </p-accordionheader>
        <p-accordioncontent> </p-accordioncontent>
      </p-accordionpanel>
      <p-accordionpanel v-if="element" :value="5">
        <p-accordionheader>Element {{ element?.index() + 1 }} / {{ voice!._elements.length }} </p-accordionheader>
        <p-accordioncontent>
          <p-inputnumber v-model="element.duration" placeholder="Duration" showButtons class="small" />
        </p-accordioncontent>
      </p-accordionpanel>
      <p-accordionpanel v-if="note" :value="6">
        <p-accordionheader>Note {{ note?.index() + 1 }} / {{ element!._notes.length }} </p-accordionheader>
        <p-accordioncontent>
          <p-inputnumber v-model="note.fretNumber" placeholder="Duration" showButtons class="small" />
          <p-inputnumber v-model="note.leftHandFinger" placeholder="leftHandFinger" showButtons class="small" />
          <p-inputnumber v-model="note.rightHandFinger" placeholder="rightHandFinger" showButtons class="small" />

          <div v-for="technique of techniqueList()" :key="technique.key" class="flex items-center gap-2">
            <p-checkbox v-model="note.techniques" :inputId="technique.key" name="category" :value="technique.key" />
            <label :for="technique.key">{{ technique.name }}</label>
          </div>
        </p-accordioncontent>
      </p-accordionpanel>
    </p-accordion>
  </aside>
</template>
<style global>
.small input {
  width: 8ch;
}

.voice-0 {
  color: var(--voice-0-color);
}

.voice-1 {
  color: var(--voice-1-color);
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
}

body.sidebar-open .middle-column {
  display: none;
}
</style>
