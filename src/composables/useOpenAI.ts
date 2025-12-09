import { ref, type Ref } from 'vue'
import type { TTSVoice, GPTModel } from '../types'

const OPENAI_BASE_URL = 'https://api.openai.com/v1'

export function useOpenAI(apiKey: Ref<string>, model: Ref<GPTModel>) {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function translateToFrench(englishText: string): Promise<string> {
    if (!apiKey.value) {
      throw new Error('API key is required')
    }

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.value,
        messages: [
          {
            role: 'system',
            content: 'You are an English to French translator. Translate the following English text to natural, fluent French. Return only the translation, no explanations or notes.',
          },
          { role: 'user', content: englishText },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Translation API error:', response.status, errorData)
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.')
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.')
      }
      if (response.status === 400) {
        throw new Error(errorData.error?.message || 'Bad request - check model name or input')
      }
      if (response.status === 404) {
        throw new Error('Model not found. The model may not be available for your account.')
      }
      throw new Error(errorData.error?.message || `Translation failed: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  }

  async function generateSpeech(text: string, voice: TTSVoice = 'nova'): Promise<Blob> {
    if (!apiKey.value) {
      throw new Error('API key is required')
    }

    const response = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: voice,
        input: text,
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.')
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.')
      }
      throw new Error(errorData.error?.message || `TTS generation failed: ${response.status}`)
    }

    return response.blob()
  }

  async function validateApiKey(): Promise<boolean> {
    if (!apiKey.value) {
      return false
    }

    try {
      const response = await fetch(`${OPENAI_BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey.value}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }

  return {
    translateToFrench,
    generateSpeech,
    validateApiKey,
    isLoading,
    error,
  }
}
