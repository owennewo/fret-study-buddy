import { Container, Graphics } from 'pixi.js'
import { type Voice } from '@/models/Voice'
import { toRaw } from 'vue'
import { useElementRenderer } from './useElementRenderer'
import { type ColourScheme, type RendererRefs } from './types'

export const useVoiceRenderer = (
  voiceColours: string[],
  colours: ColourScheme,
  refs: Pick<RendererRefs, 'currentNote' | 'currentTrack' | 'selection' | 'clickEvent' | 'voiceId'>
) => {
  const { drawElement } = useElementRenderer(voiceColours, colours, refs)

  const drawVoice = (voice: Voice, usableWidth: number, barHeight: number) => {
    const c = new Container({ label: `voice${voice.index()}` })

    // Handle selection highlighting
    const g = new Graphics()
    const selectionDimension = voice._elements.reduce(
      (acc, element) => {
        if (refs.selection.value.has(toRaw(element))) {
          // Get the current track's string count safely
          const stringCount = refs.currentTrack.value ? refs.currentTrack.value.stringCount() - 1 : 0

          return [
            Math.min(isNaN(acc[0]) ? element.location() : acc[0], element.location()),
            Math.max(
              isNaN(acc[1]) ? element.location() + element.beatDuration() : acc[1],
              element.location() + element.beatDuration()
            ),
            Math.min(isNaN(acc[2]) ? 0 : acc[2], 0),
            Math.max(isNaN(acc[3]) ? stringCount : acc[3], stringCount),
          ]
        }
        return acc
      },
      [NaN, NaN, NaN, NaN]
    )

    const voiceDuration = Math.max(voice.bar().timeSignature.beatsPerBar, voice.duration())

    // Highlight selected elements
    if (!isNaN(selectionDimension[0])) {
      g.rect(
        (selectionDimension[0] / voiceDuration) * usableWidth,
        0,
        ((selectionDimension[1] - selectionDimension[0]) / voiceDuration) * usableWidth,
        barHeight
      ).fill({ color: voiceColours[voice.index()], alpha: 0.5 })
    }
    c.addChild(g)

    // Draw all elements in the voice
    voice._elements.forEach(element => {
      c.addChild(drawElement(element, usableWidth, barHeight))
    })

    return c
  }

  return { drawVoice }
}
