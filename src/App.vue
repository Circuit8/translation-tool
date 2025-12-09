<script setup lang="ts">
import { ref, computed } from 'vue'
import ApiKeyInput from './components/ApiKeyInput.vue'
import TextInput from './components/TextInput.vue'
import TranslationDisplay from './components/TranslationDisplay.vue'
import PlaybackControls from './components/PlaybackControls.vue'
import { useTranslation } from './composables/useTranslation'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import type { GPTModel, TTSModel } from './types'

const apiKey = ref('')
const inputText = ref('')
const selectedModel = ref<GPTModel>('gpt-4o')
const selectedTTSModel = ref<TTSModel>((localStorage.getItem('ttsModel') as TTSModel) || 'tts-1')
const audioSpeed = ref(parseFloat(localStorage.getItem('audioSpeed') || '1.0'))

const {
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
} = useTranslation(apiKey, selectedModel, selectedTTSModel, audioSpeed)

const hasTranslations = computed(() => sentencePairs.value.length > 0)
const canPlay = computed(() =>
  hasTranslations.value &&
  sentencePairs.value.some(p => p.englishAudioBlob || p.frenchAudioBlob)
)

const currentPosition = computed(() => {
  if (!hasTranslations.value) return ''
  const { currentIndex, currentLanguage } = playbackState.value
  const total = sentencePairs.value.length
  return `Sentence ${currentIndex + 1}/${total} - ${currentLanguage}`
})

// Enable keyboard shortcuts when we have translations
const shortcutsEnabled = computed(() => hasTranslations.value)

useKeyboardShortcuts({
  onSpace: playNext,
  enabled: shortcutsEnabled,
})

async function handleTranslate() {
  if (!apiKey.value) {
    alert('Please enter your OpenAI API key')
    return
  }
  if (!inputText.value.trim()) {
    return
  }

  reset()
  processText(inputText.value) // Don't await - let it run in background
}

function handleSentenceClick(index: number, language: 'english' | 'french') {
  playSentence(index, language)
}

function handleSpeedChange(event: Event) {
  const target = event.target as HTMLInputElement
  const newSpeed = parseFloat(target.value)
  audioSpeed.value = newSpeed
  localStorage.setItem('audioSpeed', newSpeed.toString())

  // Regenerate audio if we have translations
  if (hasTranslations.value) {
    regenerateAudio()
  }
}

const models: { value: GPTModel; label: string }[] = [
  { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
]

const ttsModels: { value: TTSModel; label: string }[] = [
  { value: 'tts-1', label: 'TTS-1 (Fast)' },
  { value: 'tts-1-hd', label: 'TTS-1 HD (Quality)' },
]

function handleTTSModelChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const newModel = target.value as TTSModel
  selectedTTSModel.value = newModel
  localStorage.setItem('ttsModel', newModel)

  // Regenerate audio if we have translations
  if (hasTranslations.value) {
    regenerateAudio()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Error Notice -->
      <div
        v-if="lastError"
        class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between"
      >
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <div>
            <p class="text-sm font-medium text-red-800">API Error</p>
            <p class="text-sm text-red-700">{{ lastError }}</p>
          </div>
        </div>
        <button
          @click="dismissError"
          class="text-red-500 hover:text-red-700"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Header -->
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          English to French Translator
        </h1>
        <p class="text-gray-600">
          Translate text and practice with audio playback
        </p>
      </header>

      <!-- Settings -->
      <section class="mb-6 flex flex-col md:flex-row gap-4">
        <div class="max-w-md flex-1">
          <ApiKeyInput v-model="apiKey" />
        </div>
        <div class="max-w-xs">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <select
            v-model="selectedModel"
            :disabled="isProcessing"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option v-for="model in models" :key="model.value" :value="model.value">
              {{ model.label }}
            </option>
          </select>
        </div>
        <div class="max-w-xs">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            TTS Model
          </label>
          <select
            :value="selectedTTSModel"
            @change="handleTTSModelChange"
            :disabled="isProcessing"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option v-for="ttsModel in ttsModels" :key="ttsModel.value" :value="ttsModel.value">
              {{ ttsModel.label }}
            </option>
          </select>
        </div>
        <div class="max-w-xs">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Audio Speed: {{ audioSpeed.toFixed(1) }}x
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            :value="audioSpeed"
            @change="handleSpeedChange"
            :disabled="isProcessing"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>1.5x</span>
          </div>
        </div>
      </section>

      <!-- Text Input (only show if no translations yet) -->
      <section v-if="!hasTranslations" class="mb-6">
        <TextInput
          v-model="inputText"
          :disabled="isProcessing"
          @submit="handleTranslate"
        />
      </section>

      <!-- Progress indicator (inline, non-blocking) -->
      <section v-if="isProcessing" class="mb-4">
        <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm text-blue-700">{{ progress.message }}</span>
          <span class="text-sm text-blue-500">({{ progress.current }}/{{ progress.total }})</span>
        </div>
      </section>

      <!-- Playback Controls (show when we have translations) -->
      <section v-if="hasTranslations" class="mb-6">
        <PlaybackControls
          :is-playing="playbackState.isPlaying"
          :can-play="canPlay"
          :current-position="currentPosition"
          @play-next="playNext"
          @stop="stopPlayback"
        />
      </section>

      <!-- Translation Display -->
      <section v-if="hasTranslations" class="mb-6">
        <TranslationDisplay
          :sentence-pairs="sentencePairs"
          :active-index="playbackState.currentIndex"
          :active-language="playbackState.currentLanguage"
          @sentence-click="handleSentenceClick"
        />
      </section>

      <!-- New Translation Button -->
      <section v-if="hasTranslations && !isProcessing" class="mb-6">
        <button
          @click="reset(); inputText = ''"
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100"
        >
          Start New Translation
        </button>
      </section>
    </div>
  </div>
</template>
