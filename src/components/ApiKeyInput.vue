<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showKey = ref(false)
const saveToStorage = ref(true)

const STORAGE_KEY = 'openai-api-key'

// Load from localStorage on mount
const savedKey = localStorage.getItem(STORAGE_KEY)
if (savedKey) {
  emit('update:modelValue', savedKey)
}

watch(() => props.modelValue, (newValue) => {
  if (saveToStorage.value && newValue) {
    localStorage.setItem(STORAGE_KEY, newValue)
  }
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function clearKey() {
  emit('update:modelValue', '')
  localStorage.removeItem(STORAGE_KEY)
}
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700">
      OpenAI API Key
    </label>
    <div class="flex gap-2">
      <div class="relative flex-1">
        <input
          :type="showKey ? 'text' : 'password'"
          :value="modelValue"
          @input="handleInput"
          placeholder="sk-..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          @click="showKey = !showKey"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {{ showKey ? 'Hide' : 'Show' }}
        </button>
      </div>
      <button
        v-if="modelValue"
        type="button"
        @click="clearKey"
        class="px-3 py-2 text-sm text-red-600 hover:text-red-800"
      >
        Clear
      </button>
    </div>
    <label class="flex items-center gap-2 text-sm text-gray-600">
      <input
        type="checkbox"
        v-model="saveToStorage"
        class="rounded border-gray-300"
      />
      Save key locally
    </label>
  </div>
</template>
