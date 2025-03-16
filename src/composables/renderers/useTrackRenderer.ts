import { Container } from 'pixi.js'
import type { Track } from '@/models/Track'
import { useBarRenderer } from './useBarRenderer'
import { type ColourScheme, type RendererRefs } from './types'

export const useTrackRenderer = (
  voiceColours: string[],
  colours: ColourScheme,
  refs: RendererRefs
) => {
  const { drawBar } = useBarRenderer(
    voiceColours,
    colours,
    refs
  )

  const drawTrack = (track: Track, width: number): Container => {
    const barPadding = refs.score.value?.fontSize || 16
    const trackContainer = new Container({ label: `track${track.index()}` })

    // Calculate dimensions
    const barWidth = width / (refs.score.value?.barsPerLine || 4)
    const numberOfTracks = track.score()._tracks.length
    const totalStrings = refs.score.value?._tracks.reduce(
      (acc, track) => acc + track.stringCount(), 0
    ) || 0
    const trackHeight = barPadding * (totalStrings - numberOfTracks) +
                       2 * barPadding * numberOfTracks
    const barHeight = barPadding * (totalStrings - numberOfTracks)

    // Draw all bars in the track
    track._bars.forEach(bar => {
      const barContainer = drawBar(bar, barWidth, barHeight, trackHeight)
      trackContainer.addChild(barContainer)
    })

    return trackContainer
  }

  return { drawTrack }
}
