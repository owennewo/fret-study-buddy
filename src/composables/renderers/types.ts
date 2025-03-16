import { type Ref } from 'vue'
import { type Voice } from '@/models/Voice'
import { type Note } from '@/models/Note'
import { type VoiceElement } from '@/models/VoiceElement'
import { type Track } from '@/models/Track'
import { type Bar } from '@/models/Bar'
import { type Score } from '@/models/Score'

// Common types used across renderer components
export interface ColourScheme {
  primary: string
  secondary: string
}

// Types for the reactive refs used in renderers
export interface RendererRefs {
  currentNote: Ref<Note | null>
  currentElement: Ref<VoiceElement | null>
  currentTrack: Ref<Track | null>
  currentBar: Ref<Bar | null>
  selection: Ref<Set<Voice | Track | Bar | VoiceElement | Note>>
  voiceId: Ref<number>
  clickEvent: Ref<Event | null>
  score: Ref<Score | null>
  canvasRef: Ref<HTMLCanvasElement | null>
}
