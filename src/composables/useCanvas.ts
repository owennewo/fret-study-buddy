import { computed, ref, toRaw, type Ref, watchEffect, onUnmounted } from 'vue'
import { useCursor } from '@/composables/useCursor'
import { Application, Container } from 'pixi.js'
import { usePixiSetup } from './usePixiSetup'
import { useTrackRenderer } from './renderers/useTrackRenderer'
import { type ColourScheme } from './renderers/types'

// Global refs and state
const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)
const canvasContainerRef: Ref<HTMLDivElement | null> = ref(null)
const clickEvent = ref<Event | null>(null)
const forceRedraw = ref(0) // New ref to force redraws
const canvasSize = ref({ width: 0, height: 0 }) // New ref to track canvas size
let pixi: Application | null = null

// Flag to prevent multiple simultaneous redraws
const isDrawing = ref(false)

export const useCanvas = () => {
  const backgroundColour = 'lightgrey'
  const voiceColours = ['#8e0000', '#4a0072', '#0000b2', '#004d40']

  // Get cursor and other state from useCursor
  const {
    score,
    note: currentNote,
    element: currentElement,
    bar: currentBar,
    track: currentTrack,
    selection,
    voiceId,
    isDarkMode,
  } = useCursor()

  // Computed colours based on dark mode
  const colours = computed<ColourScheme>(() => {
    return isDarkMode.value
      ? { primary: 'white', secondary: 'black' }
      : { primary: 'black', secondary: 'white' }
  })

  // Container for the entire page
  const pageContainer = new Container({ label: 'page' })

  // Hot reload handling
  if (import.meta.hot) {
    const registered = import.meta.hot.data.registered || false
    if (!registered) {
      import.meta.hot.data.registered = true
      import.meta.hot.accept(() => {
        console.log('HOT RELOAD!')
        forceRedraw.value++ // Trigger redraw through reactivity
      })
    }
  }

  // Handler functions
  const handleCanvasResize = () => {
    forceRedraw.value++ // Trigger redraw through reactivity
  }

  const handleWindowResize = () => {
    const wrapper = document.getElementById('canvas-wrapper')
    if (wrapper) {
      canvasSize.value = {
        width: wrapper.clientWidth,
        height: wrapper.clientHeight
      }
    }
  }

  // Set up event listeners
  window.addEventListener('canvas-resize', handleCanvasResize)
  window.addEventListener('resize', handleWindowResize)

  // Clean up event listeners
  onUnmounted(() => {
    window.removeEventListener('canvas-resize', handleCanvasResize)
    window.removeEventListener('resize', handleWindowResize)
    if (pixi) {
      pixi.destroy()
      pixi = null
    }
  })

  // Main score drawing function
  const drawScore = async () => {
    console.log('Drawing score...')
    // Prevent multiple simultaneous draws
    if (isDrawing.value) return
    isDrawing.value = true

    try {
      if (!score.value) {
        console.log('No score found')
        return
      }

      // Initialize selection if empty
      if (selection.value.size === 0) {
        selection.value = new Set([toRaw(currentElement.value)])
      }

      // Initialize PixiJS if not already done
      if (pixi === null) {
        const { setupPixi } = usePixiSetup(canvasRef, backgroundColour)
        pixi = await setupPixi()
      }

      // Layout constants
      const verticalGap = 30 + score.value.fontSize * 2
      const horizontalGap = 20

      // Clear previous rendering
      pageContainer.removeChildren()
      pixi.stage.removeChildren()

      // Create container for the score
      const scoreContainer = new Container({ label: 'score' })
      const wrapper = document.getElementById('canvas-wrapper')!
      const canvasWidth = wrapper.clientWidth

      // Prepare renderer refs object
      const rendererRefs = {
        currentNote,
        currentElement,
        currentTrack,
        currentBar,
        selection,
        voiceId,
        clickEvent,
        score,
        canvasRef
      }

      // Initialize track renderer
      const { drawTrack } = useTrackRenderer(
        voiceColours,
        colours.value,
        rendererRefs
      )

      // Draw all tracks in the score
      score.value._tracks.forEach(track => {
        const usableWidth = canvasWidth - 2 * horizontalGap
        scoreContainer.addChild(drawTrack(track, usableWidth))
      })

      // Position the score container
      scoreContainer.y = verticalGap
      scoreContainer.x = horizontalGap

      // Add the score to the page
      pageContainer.addChild(scoreContainer)

      // Update renderer size and background
      if (pixi.renderer) {
        pixi.renderer.background.color = colours.value.secondary
        pixi.renderer.resize(
          wrapper.clientWidth,
          Math.floor(Math.max(scoreContainer.height + verticalGap, wrapper.clientHeight)) - 1,
        )
      } else {
        console.warn('RESIZE FAILED', pixi, pixi?.renderer)
      }

      // Add the page to the stage
      pixi.stage.addChild(pageContainer)
    } finally {
      isDrawing.value = false
    }
  }

  // Use watchEffect to directly track reactive dependencies
  watchEffect(() => {
    // Access reactive values directly so they're tracked
    if (
      canvasRef.value &&
      score.value &&
      // Access all reactive values that should trigger a redraw
      // currentNote.value &&
      currentElement.value &&
      currentBar.value &&
      currentTrack.value &&
      selection.value &&
      voiceId.value !== undefined &&
      isDarkMode.value !== undefined &&
      colours.value &&
      forceRedraw.value >= 0 &&
      canvasSize.value
    ) {
      drawScore()
    }
  })

  return { canvasRef, canvasContainerRef, voiceColours, clickEvent }
}
