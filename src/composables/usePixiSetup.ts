import { Application } from 'pixi.js'
import { initDevtools } from '@pixi/devtools'
import { type Ref } from 'vue'

export const usePixiSetup = (canvasRef: Ref<HTMLCanvasElement | null>, backgroundColour: string) => {
  const setupPixi = async () => {
    const app = new Application()

    const wrapper = document.getElementById('canvas-wrapper')!
    let first = true
    const resizeObserver = new ResizeObserver(() => {
      if (first) {
        first = false
      } else {
        console.log("canvas resize detected")
        // Dispatch an event that can be listened to in useCanvas
        window.dispatchEvent(new CustomEvent('canvas-resize'))
      }
    })
    resizeObserver.observe(wrapper)

    await app.init({
      canvas: canvasRef.value!,
      backgroundColor: backgroundColour,
    })
    initDevtools(app)
    return app
  }

  return { setupPixi }
}
