import { initDevtools } from "@pixi/devtools";
import { Application, Container, Graphics, type Renderer } from "pixi.js"
import { ref, type Ref } from "vue"


let pixiFretboard: Application<Renderer>; // = new Application()

const guitarContainer = new Container({ label: 'guitar' })
const scaleLength = 645;
const nutWidth = 44 * 2; // wider so that the strings can be drawn
const bridgeWidth = 56 * 2;
const fretCount = 20;
const bridgeX = scaleLength; // Position at the end of the fretboard
const bridgeYOffset = (bridgeWidth - nutWidth) / 2; // Center bridge lines

const drawGuitar = (c: Container) => {
  const g = new Graphics();
  // Draw the fretboard
  g.moveTo(0, 0) // Top-left corner (nut width, left side)
    .lineTo(scaleLength, -bridgeYOffset) // Top-right corner (bridge width, left side)
    .lineTo(scaleLength, nutWidth + bridgeYOffset) // Bottom-right corner (bridge width, right side)
    .lineTo(0, nutWidth) // Bottom-left corner (nut width, right side)
    .closePath()
    .fill('brown')
    .stroke({ width: 1, color: 'black'});

  // Draw the nut
  g.moveTo(0, 0)
    .lineTo(0, nutWidth)
    .fill("ivory")
    .stroke({ width: 8, color: 'ivory'})

  // Draw the bridge
  g.moveTo(bridgeX, -bridgeYOffset)
    .lineTo(bridgeX, nutWidth + bridgeYOffset)
    .fill("ivory")
    .stroke({ width: 8, color: 'ivory'})

  // Draw frets
  for (let i = 1; i <= fretCount; i++) {
    const fretPosition = scaleLength * (1 - 1 / Math.pow(2, i / 12));
    const fretYOffset = (bridgeWidth - nutWidth) * (fretPosition / scaleLength) / 2;

    g.moveTo(fretPosition, -fretYOffset)
      .lineTo(fretPosition, nutWidth + fretYOffset)
      .fill("silver")
      .stroke({ width: 2, color: 'silver'})
  }

  const stringCount = 6; // Number of strings
  for (let i = 0; i < stringCount; i++) {
    const stringYOffsetNut = (nutWidth / (stringCount - 1)) * i; // Position at the nut
    const stringYOffsetBridge = (bridgeWidth / (stringCount - 1)) * i - bridgeYOffset; // Position at the bridge

    g.moveTo(0, stringYOffsetNut) // Start at the nut
      .lineTo(scaleLength, stringYOffsetBridge)
      .fill("silver")
      .stroke({ width: 2, color: 'silver'})
  }

  // Set the position of the container
  c.x = 20;
  c.y = 20;

  // Add the Graphics object to the container
  c.addChild(g);
};

export const useFretboard = () => {

  const fretboardRef: Ref<HTMLCanvasElement | null> = ref(null)

  const drawFretboard = () => {

    if (!fretboardRef.value) {
      console.warn('fretboardRef not set')
      return
    }
    if (!pixiFretboard) {
      pixiFretboard = new Application()

      pixiFretboard.init({
        canvas: fretboardRef.value!,
        backgroundColor: 'orange',
        antialias: true
      })
      initDevtools(pixiFretboard)
      console.log('pixiFretboard', pixiFretboard)
    }
    if (pixiFretboard && pixiFretboard.renderer) {
      pixiFretboard.renderer.background.color = 'brown'
    }

    drawGuitar(guitarContainer)

    pixiFretboard.stage.addChild(guitarContainer)

    if (pixiFretboard && pixiFretboard.renderer) {
      pixiFretboard!.renderer.background.color = 'green'
      pixiFretboard!.renderer.resize(
        1200,
        300,
      )
    } else {
      console.warn(' RESIZE FAILED')
    }

  }

 return { fretboardRef, drawFretboard }
}
