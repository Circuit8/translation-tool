import { ref, computed, type Ref } from 'vue'
import type { SentencePair, TranslationProgress, PlaybackState, GPTModel, TTSModel } from '../types'
import { useOpenAI } from './useOpenAI'
import { useAudioPlayer } from './useAudioPlayer'
import { splitIntoSentences } from '../utils/textProcessor'

export function useTranslation(apiKey: Ref<string>, model: Ref<GPTModel>, ttsModel: Ref<TTSModel>, speed: Ref<number>) {
  const { translateToFrench, generateSpeech } = useOpenAI(apiKey, model, ttsModel)
  const audioPlayer = useAudioPlayer()

  const sentencePairs = ref<SentencePair[]>([])
  const progress = ref<TranslationProgress>({
    phase: 'idle',
    current: 0,
    total: 0,
    message: '',
  })
  const lastError = ref<string | null>(null)

  const playbackState = ref<PlaybackState>({
    currentIndex: 0,
    currentLanguage: 'english',
    isPlaying: false,
  })

  const isProcessing = computed(() => progress.value.phase !== 'idle' && progress.value.phase !== 'complete')

  const playbackSequence = computed(() => {
    const sequence: Array<{ index: number; language: 'english' | 'french' }> = []
    sentencePairs.value.forEach((_, index) => {
      sequence.push({ index, language: 'english' })
      sequence.push({ index, language: 'french' })
    })
    return sequence
  })

  let currentSequencePosition = 0

  function dismissError() {
    lastError.value = null
  }

  async function processText(englishText: string) {
    const sentences = splitIntoSentences(englishText)
    if (sentences.length === 0) {
      return
    }

    lastError.value = null
    progress.value = {
      phase: 'translating',
      current: 0,
      total: sentences.length,
      message: 'Starting translation...',
    }

    // Initialize all sentence pairs immediately so UI shows them
    sentencePairs.value = sentences.map((english, i) => ({
      id: `sentence-${i}`,
      english,
      french: null,
      englishAudioBlob: null,
      frenchAudioBlob: null,
      status: 'pending',
    }))

    // Reset playback state
    currentSequencePosition = 0
    playbackState.value = {
      currentIndex: 0,
      currentLanguage: 'english',
      isPlaying: false,
    }

    // Process each sentence sequentially (but don't block UI)
    for (let i = 0; i < sentences.length; i++) {
      const currentPair = sentencePairs.value[i]
      if (!currentPair) continue

      progress.value.current = i + 1
      progress.value.message = `Translating sentence ${i + 1} of ${sentences.length}...`
      currentPair.status = 'translating'

      // Translate
      try {
        const sentence = sentences[i]
        if (sentence) {
          const french = await translateToFrench(sentence)
          currentPair.french = french
        }
      } catch (err) {
        currentPair.status = 'error'
        currentPair.error = err instanceof Error ? err.message : 'Translation failed'
        lastError.value = currentPair.error
        continue
      }

      // Generate English audio
      currentPair.status = 'generating-audio'
      progress.value.message = `Generating audio for sentence ${i + 1}...`

      try {
        currentPair.englishAudioBlob = await generateSpeech(currentPair.english, 'nova', speed.value)
      } catch (err) {
        currentPair.status = 'error'
        currentPair.error = err instanceof Error ? err.message : 'English audio generation failed'
        lastError.value = currentPair.error
        continue
      }

      // Generate French audio
      if (currentPair.french) {
        try {
          currentPair.frenchAudioBlob = await generateSpeech(currentPair.french, 'nova', speed.value)
        } catch (err) {
          currentPair.status = 'error'
          currentPair.error = err instanceof Error ? err.message : 'French audio generation failed'
          lastError.value = currentPair.error
          continue
        }
      }

      currentPair.status = 'complete'
    }

    progress.value = {
      phase: 'complete',
      current: sentences.length,
      total: sentences.length,
      message: 'Complete!',
    }
  }

  async function playNext() {
    if (playbackSequence.value.length === 0) return

    // If currently playing, stop and move to next
    if (playbackState.value.isPlaying) {
      audioPlayer.stop()
      playbackState.value.isPlaying = false
      currentSequencePosition++ // Skip to the next item
    }

    // Find the next playable item (with a limit to prevent infinite loops)
    const maxAttempts = playbackSequence.value.length
    let attempts = 0

    while (attempts < maxAttempts) {
      if (currentSequencePosition >= playbackSequence.value.length) {
        currentSequencePosition = 0
      }

      const currentItem = playbackSequence.value[currentSequencePosition]
      if (!currentItem) {
        currentSequencePosition++
        attempts++
        continue
      }

      const { index, language } = currentItem
      const pair = sentencePairs.value[index]

      // Skip if pair doesn't exist, has error, or audio not ready yet
      const audioBlob = language === 'english' ? pair?.englishAudioBlob : pair?.frenchAudioBlob
      if (!pair || pair.status === 'error' || !audioBlob) {
        currentSequencePosition++
        attempts++
        continue
      }

      // Found a playable item
      playbackState.value = {
        currentIndex: index,
        currentLanguage: language,
        isPlaying: true,
      }

      try {
        await audioPlayer.play(audioBlob)
      } catch (err) {
        console.error('Audio playback failed:', err)
      }

      playbackState.value.isPlaying = false
      currentSequencePosition++
      return
    }

    // No playable items found
    console.warn('No playable sentences found')
  }

  function playSentence(index: number, language: 'english' | 'french') {
    const pair = sentencePairs.value[index]
    if (!pair) return

    const audioBlob = language === 'english' ? pair.englishAudioBlob : pair.frenchAudioBlob
    if (!audioBlob) return

    playbackState.value = {
      currentIndex: index,
      currentLanguage: language,
      isPlaying: true,
    }

    audioPlayer.play(audioBlob).then(() => {
      playbackState.value.isPlaying = false
    }).catch((err) => {
      console.error('Audio playback failed:', err)
      playbackState.value.isPlaying = false
    })

    // Update sequence position to continue from here
    currentSequencePosition = playbackSequence.value.findIndex(
      (item) => item.index === index && item.language === language
    )
    if (currentSequencePosition !== -1) {
      currentSequencePosition++ // Move to next after current
    }
  }

  function stopPlayback() {
    audioPlayer.stop()
    playbackState.value.isPlaying = false
  }

  function reset() {
    stopPlayback()
    sentencePairs.value = []
    progress.value = {
      phase: 'idle',
      current: 0,
      total: 0,
      message: '',
    }
    lastError.value = null
    currentSequencePosition = 0
  }

  async function regenerateAudio() {
    if (sentencePairs.value.length === 0) return

    stopPlayback()
    lastError.value = null

    const pairs = sentencePairs.value.filter(p => p.english && p.french)
    if (pairs.length === 0) return

    progress.value = {
      phase: 'generating-audio',
      current: 0,
      total: pairs.length,
      message: 'Regenerating audio...',
    }

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i]
      if (!pair) continue

      progress.value.current = i + 1
      progress.value.message = `Regenerating audio for sentence ${i + 1}...`
      pair.status = 'generating-audio'

      // Generate English audio
      try {
        pair.englishAudioBlob = await generateSpeech(pair.english, 'nova', speed.value)
      } catch (err) {
        pair.status = 'error'
        pair.error = err instanceof Error ? err.message : 'English audio generation failed'
        lastError.value = pair.error
        continue
      }

      // Generate French audio
      if (pair.french) {
        try {
          pair.frenchAudioBlob = await generateSpeech(pair.french, 'nova', speed.value)
        } catch (err) {
          pair.status = 'error'
          pair.error = err instanceof Error ? err.message : 'French audio generation failed'
          lastError.value = pair.error
          continue
        }
      }

      pair.status = 'complete'
    }

    progress.value = {
      phase: 'complete',
      current: pairs.length,
      total: pairs.length,
      message: 'Audio regenerated!',
    }

    // Reset playback position
    currentSequencePosition = 0
    playbackState.value = {
      currentIndex: 0,
      currentLanguage: 'english',
      isPlaying: false,
    }
  }

  return {
    sentencePairs,
    progress,
    playbackState,
    isProcessing,
    lastError,
    processText,
    playNext,
    playSentence,
    stopPlayback,
    reset,
    dismissError,
    regenerateAudio,
  }
}
