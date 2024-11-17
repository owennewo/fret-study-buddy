import type { MusicalScore } from '@/models/MusicalScore'
import { ref, watch, type Ref } from 'vue'

const project: Ref<string | null> = ref(null)
const score: Ref<MusicalScore | null> = ref(null)
const track = ref(0)
const bar = ref(0)
const voice = ref(0)
const element = ref(0)
const note = ref(0)

export const useCursor = () => {
  return {
    project,
    score,
    track,
    bar,
    voice,
    element,
    note,
  }
}
