import { ref, onUnmounted } from 'vue'

export function useAudioPlayer() {
  const audioElement = ref<HTMLAudioElement | null>(null)
  const isPlaying = ref(false)
  const currentBlobUrl = ref<string | null>(null)

  let onEndedCallback: (() => void) | null = null

  function play(source: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      stop()

      const url = URL.createObjectURL(source)
      currentBlobUrl.value = url

      audioElement.value = new Audio(url)

      audioElement.value.onended = () => {
        isPlaying.value = false
        cleanup()
        if (onEndedCallback) {
          onEndedCallback()
        }
        resolve()
      }

      audioElement.value.onerror = () => {
        isPlaying.value = false
        cleanup()
        reject(new Error('Audio playback failed'))
      }

      isPlaying.value = true
      audioElement.value.play().catch((err) => {
        isPlaying.value = false
        cleanup()
        reject(err)
      })
    })
  }

  function stop() {
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value.currentTime = 0
      isPlaying.value = false
    }
    cleanup()
  }

  function cleanup() {
    if (currentBlobUrl.value) {
      URL.revokeObjectURL(currentBlobUrl.value)
      currentBlobUrl.value = null
    }
  }

  function onEnded(callback: () => void) {
    onEndedCallback = callback
  }

  onUnmounted(() => {
    stop()
  })

  return {
    play,
    stop,
    isPlaying,
    onEnded,
  }
}
