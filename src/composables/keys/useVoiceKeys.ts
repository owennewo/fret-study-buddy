// import { useCursor } from '../useCursor'
// import { useCanvas } from '../useCanvas'

// const { track, bar, voice, voiceId, element, note } = useCursor()
// const { drawScore } = useCanvas()

// export const useVoiceKeys = () => {
//   const voiceHandler = (event: KeyboardEvent) => {
//     const pressedKey = event.key

//     switch (pressedKey) {
//       case 'ArrowUp':
//         voiceId.value = Math.max(voiceId.value - 1, 0)
//         drawScore()
//         return
//       case 'ArrowDown':
//         voiceId.value = Math.min(voiceId.value + 1, track.value.voiceCount - 1)
//         drawScore()
//       case 'ArrowRight':
//       case 'ArrowLeft':
//         return
//       default:
//         if (typeof pressedKey === 'number') {
//           console.log('voice received number')
//         } else {
//           console.log('voice: unhandled key:', pressedKey)
//         }
//     }
//   }

//   return { voiceHandler }
// }
