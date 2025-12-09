<script setup lang="ts">
defineProps<{
  isPlaying: boolean
  canPlay: boolean
  currentPosition: string
}>()

const emit = defineEmits<{
  'play-next': []
  'stop': []
}>()
</script>

<template>
  <div class="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
    <button
      @click="emit('play-next')"
      :disabled="!canPlay || isPlaying"
      class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
      </svg>
      Play Next
    </button>

    <button
      v-if="isPlaying"
      @click="emit('stop')"
      class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
      </svg>
      Stop
    </button>

    <div class="flex-1 text-sm text-gray-600">
      <span v-if="isPlaying" class="flex items-center gap-2">
        <span class="animate-pulse w-2 h-2 bg-green-500 rounded-full"></span>
        Playing...
      </span>
      <span v-else-if="currentPosition">
        {{ currentPosition }}
      </span>
      <span v-else class="text-gray-400">
        Press Space or click "Play Next" to start
      </span>
    </div>

    <div class="text-xs text-gray-500">
      <kbd class="px-2 py-1 bg-white rounded border border-gray-300">Space</kbd>
    </div>
  </div>
</template>
