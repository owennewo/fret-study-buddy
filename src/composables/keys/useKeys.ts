let sequence = ''

interface RegexHandler {
  handler: (sequence: string) => void
}

const regexHandlers: Map<RegExp, RegexHandler> = new Map()
let isEventListenerRegistered = false
let debounceTimer: NodeJS.Timeout | null = null

export const useKeys = () => {
  console.log('useKeys')

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
        if (!regex.source.endsWith('$')) {
          debounceTimer = setTimeout(() => (sequence = ''), 400)
        } else {
          sequence = ''
        }
        event.preventDefault()
        return
      }
    }
    console.log(`unknown '${sequence}'`)
    sequence = ''
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
