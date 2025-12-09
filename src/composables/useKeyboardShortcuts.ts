import { onMounted, onUnmounted, type Ref } from 'vue'

interface KeyboardShortcutsOptions {
  onSpace: () => void
  enabled: Ref<boolean>
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  function handleKeydown(event: KeyboardEvent) {
    if (!options.enabled.value) return

    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return
    }

    if (event.code === 'Space') {
      event.preventDefault()
      options.onSpace()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}
