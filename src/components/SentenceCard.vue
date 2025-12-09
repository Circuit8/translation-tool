<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  sentence: string
  isActive: boolean
  isLoading?: boolean
  language: 'english' | 'french'
}>()

const emit = defineEmits<{
  'click': []
}>()

const cardRef = ref<HTMLElement | null>(null)

watch(() => props.isActive, (isActive) => {
  if (isActive && cardRef.value) {
    cardRef.value.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }
})
</script>

<template>
  <div
    ref="cardRef"
    @click="emit('click')"
    :class="[
      'p-3 rounded-lg cursor-pointer transition-all duration-200',
      isActive
        ? 'bg-blue-100 ring-2 ring-blue-500 shadow-md'
        : 'bg-white hover:bg-gray-50 border border-gray-200',
      isLoading && 'opacity-50'
    ]"
  >
    <div class="flex items-start gap-2">
      <div class="flex-1">
        <p :class="[
          'text-sm',
          language === 'french' ? 'italic' : ''
        ]">
          {{ sentence }}
        </p>
      </div>
      <div v-if="isLoading" class="flex-shrink-0">
        <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div v-else class="flex-shrink-0 text-gray-400 hover:text-blue-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
  </div>
</template>
