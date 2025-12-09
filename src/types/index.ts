export interface SentencePair {
  id: string
  english: string
  french: string | null
  englishAudioBlob: Blob | null
  frenchAudioBlob: Blob | null
  status: 'pending' | 'translating' | 'generating-audio' | 'complete' | 'error'
  error?: string
}

export type GPTModel = 'gpt-5-mini' | 'gpt-4o-mini' | 'gpt-4o'

export type TTSModel = 'tts-1' | 'tts-1-hd'

export interface PlaybackState {
  currentIndex: number
  currentLanguage: 'english' | 'french'
  isPlaying: boolean
}

export interface TranslationProgress {
  phase: 'idle' | 'translating' | 'generating-audio' | 'complete'
  current: number
  total: number
  message: string
}

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'

export interface OpenAIConfig {
  model: string
  ttsModel: string
  ttsVoice: TTSVoice
}
