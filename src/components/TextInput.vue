<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': []
}>()

const characterCount = computed(() => props.modelValue.length)

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function handleSubmit() {
  if (props.modelValue.trim() && !props.disabled) {
    emit('submit')
  }
}
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700">
      English Text
    </label>
    <textarea
      :value="modelValue"
      @input="handleInput"
      :disabled="disabled"
      placeholder="Enter your English text here. Each sentence will be translated individually..."
      rows="6"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
    />
    <div class="flex justify-between items-center">
      <span class="text-sm text-gray-500">
        {{ characterCount }} characters
      </span>
      <button
        type="button"
        @click="handleSubmit"
        :disabled="!modelValue.trim() || disabled"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Translate
      </button>
    </div>
  </div>
</template>
