import { Container, Graphics, Text, TextStyle, type TextOptions } from 'pixi.js'
import type { Bar } from '@/models/Bar'
import { useVoiceRenderer } from './useVoiceRenderer'
import { toRaw } from 'vue'
import { type ColourScheme, type RendererRefs } from './types'

export const useBarRenderer = (
  voiceColours: string[],
  colours: ColourScheme,
  refs: Pick<RendererRefs, 'currentNote' | 'currentTrack' | 'currentBar' | 'selection' | 'clickEvent' | 'voiceId' | 'canvasRef'>
) => {
  const { drawVoice } = useVoiceRenderer(
    voiceColours,
    colours,
    refs
  )

  const drawBar = (bar: Bar, barWidth: number, barHeight: number, trackHeight: number): Container => {
    // Calculate position based on bar index and bars per line
    const x = barWidth * (bar.index() % bar.score().barsPerLine)
    const y = trackHeight * Math.floor(bar.index() / bar.score().barsPerLine)

    const padding = bar.score().fontSize
    const usableWidth = barWidth - padding * 2

    // Create bar container
    const c = new Container({
      label: `bar${bar.index()}`,
      x: x,
      y: y,
    })

    // Add interactivity
    // if (!c.interactive) {
    //   c.interactive = true
    //   c['source'] = bar
    //   c.on('pointerdown', (event) => {
    //     console.log('Bar clicked', bar.index())
    //     event.stopPropagation()
    //     refs.clickEvent.value = event
    //   })
    // }

    // Create inner container with padding
    const c2 = new Container({
      label: `inner${bar.index()}`,
      x: padding,
      y: 0,
    })

    const stringSpacing = barHeight / (bar.track().stringCount() - 1)

    // Graphics for bars and frets
    const g = new Graphics()
    const g2 = new Graphics()

    // Add a transparent rectangle to capture clicks
    g.rect(0, 0, barWidth, barHeight).fill({ color: 'red', alpha: refs.selection.value.has(toRaw(bar)) ? 0.5 : 0 })

    // Draw horizontal string lines
    for (let i = 0; i < bar.track().stringCount(); i++) {
      const lineY = i * stringSpacing
      g.moveTo(0, lineY).lineTo(barWidth, lineY).stroke({ width: 1, color: colours.primary })
    }

    // Draw vertical start and end bars with appropriate thickness
    g.moveTo(0, 0)
      .lineTo(0, barHeight + 1)
      .moveTo(barWidth, 0)
      .stroke({ width: bar.index() == 0 ? 4 : 1, color: colours.primary })
      .lineTo(barWidth, barHeight + 1) // End bar
      .stroke({ width: bar.index() == bar.track()._bars.length - 1 ? 4 : 1, color: colours.primary })

    // Highlight selected bar
    if (refs.selection.value.has(bar)) {
      console.log('BAR selected', bar.index())
      g.rect(0, 0, barWidth, barHeight)
        .fill({ color: 'red', alpha: 0.25 })
    }

    // Add bar number
    const textStyle = new TextStyle({
      fontSize: bar.score().fontSize,
      fill: colours.primary,
    })

    const t = new Text({
      text: (bar.index() + 1).toString(),
      style: textStyle,
      x: 0,
      y: -1.5 * bar.score().fontSize,
    } as TextOptions)

    // Draw beat indicators
    for (let i = 0; i < bar.timeSignature.beatsPerBar; i++) {
      const x = (usableWidth * i) / bar.timeSignature.beatsPerBar
      g2.moveTo(x, barHeight).lineTo(x, barHeight + 1.5 * bar.score().fontSize)
        .stroke({ width: 3, alpha: 0.25 })
    }

    // Draw partial beat indicators
    bar._voices[refs.voiceId.value]._elements.forEach(element => {
      if (element.location() - Math.floor(element.location()) > 0.1) {
        const x = (usableWidth * element.location()) / bar.timeSignature.beatsPerBar
        g2.moveTo(x, barHeight)
          .lineTo(x, barHeight + 1.5 * element.beatDuration() * bar.score().fontSize)
          .stroke({ width: 2, alpha: 0.25 })
      }
    })

    // Assemble components
    c.addChild(g)
    c.addChild(t)
    c.addChild(c2)
    c2.addChild(g2)

    // Draw all voices in the bar
    bar._voices.forEach(voice => {
      c2.addChild(drawVoice(voice, usableWidth, barHeight))
    })

    // Auto-scroll to show current bar if needed
    if (toRaw(refs.currentBar.value) === toRaw(bar)) {
      // Get the canvas DOM element from the ref
      const canvasElement = refs.canvasRef.value

      // Get the scrollable parent element
      const scrollableElement = canvasElement?.parentElement

      // Ensure we have a valid parent element
      if (scrollableElement) {
        const barTopDiff = c.getGlobalPosition().y - scrollableElement.scrollTop
        const barBottomDiff =
          c.getGlobalPosition().y +
          c.getBounds().height -
          (scrollableElement.scrollTop + scrollableElement.getBoundingClientRect().height)

        if (barTopDiff < 0) {
          // can't see top of bar
          console.log('top needs move of ', barTopDiff)
          scrollableElement.scrollTop += barTopDiff
        } else if (barBottomDiff > 0) {
          // can't see bottom of bar
          console.log('bottom needs move of ', barBottomDiff)
          scrollableElement.scrollTop += barTopDiff
        }
      }
    }

    return c
  }

  return { drawBar }
}
