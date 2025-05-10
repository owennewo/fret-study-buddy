let sequence = ''

interface RegexHandler {
  handler: (sequence: string) => void
}
let lastRegex: RegExp | null = null
const regexHandlers: Map<RegExp, RegexHandler> = new Map()
let isEventListenerRegistered = false
let debounceTimer: number | undefined = undefined

export const useKeys = () => {
  const ignore = (event: KeyboardEvent): boolean => {
    const target = event.target as HTMLElement
    const { tagName } = target

    if (
      event.key == '' ||
      event.key == 'Meta' ||
      event.key == 'Alt' ||
      event.key == 'Control' ||
      event.key == 'Shift' ||
      event.key == 'Tab' ||
      event.key == 'Escape'
    ) {
      return true
    }
    const isInput =
      tagName === 'INPUT' &&
      !['checkbox', 'radio', 'range', 'button', 'file', 'reset', 'submit', 'color'].includes(
        (target as HTMLInputElement).type,
      )

    return (
      target.isContentEditable ||
      ((isInput || tagName === 'TEXTAREA' || tagName === 'SELECT') &&
        !(target as HTMLInputElement | HTMLTextAreaElement).readOnly)
    )
  }

  const handleKeys = (event: KeyboardEvent): void => {
    let pressedKey = event.key

    if (ignore(event)) {
      return
    }

    if (event.shiftKey) {
      pressedKey = 'shift+' + pressedKey
    }
    if (event.altKey) {
      pressedKey = 'alt+' + pressedKey
    }
    if (event.metaKey) {
      pressedKey = 'meta+' + pressedKey
    }
    if (event.ctrlKey) {
      pressedKey = 'ctrl+' + pressedKey
    }

    if (lastRegex) {
      if (lastRegex.test(sequence + pressedKey)) {
        console.log(`continue ${lastRegex.source}: ${sequence + pressedKey}`)
      } else {
        sequence = ''
        lastRegex = null
      }
    }
    sequence += pressedKey
    checkRegex(event)
  }

  const checkRegex = (event): void => {
    for (const [regex, { handler }] of regexHandlers) {
      if (regex.test(sequence)) {
        handler(sequence)
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }
        lastRegex = regex
        debounceTimer = setTimeout(() => {
          sequence = ''
          lastRegex = null
        }, 400)
        event.preventDefault()
        return
      }
    }
    console.log(`unknown '${sequence}'`)
    sequence = ''
    lastRegex = null
  }

  const bind = (regex: RegExp | string, handler: (sequence: string) => void): void => {
    if (typeof regex === 'string') {
      regex = new RegExp(regex)
    }
    regexHandlers.set(regex, { handler })
  }

  if (!isEventListenerRegistered) {
    window.addEventListener('keydown', handleKeys)
    isEventListenerRegistered = true
  }

  return { handleKeys, bind, checkRegex }
}
