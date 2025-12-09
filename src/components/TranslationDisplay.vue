<script setup lang="ts">
import type { SentencePair } from "../types";
import SentenceCard from "./SentenceCard.vue";

const props = defineProps<{
  sentencePairs: SentencePair[];
  activeIndex: number;
  activeLanguage: "english" | "french";
}>();

const emit = defineEmits<{
  "sentence-click": [index: number, language: "english" | "french"];
}>();

function isActive(index: number, language: "english" | "french"): boolean {
  return props.activeIndex === index && props.activeLanguage === language;
}

function isLoading(
  pair: SentencePair,
  language: "english" | "french"
): boolean {
  if (language === "french") {
    return (
      pair.status === "translating" ||
      (pair.status === "generating-audio" && !pair.french)
    );
  }
  return false;
}
</script>

<template>
  <div class="overflow-y-auto max-h-[70vh]">
    <!-- Header row -->
    <div class="grid grid-cols-2 gap-4 mb-3 sticky top-0 bg-gray-50 py-2">
      <h3 class="text-lg font-semibold text-gray-700">English</h3>
      <h3 class="text-lg font-semibold text-gray-700">French</h3>
    </div>

    <!-- Sentence rows -->
    <div class="space-y-2">
      <div
        v-for="(pair, index) in sentencePairs"
        :key="pair.id"
        class="grid grid-cols-2 gap-4 p-1"
      >
        <!-- English -->
        <SentenceCard
          :sentence="pair.english"
          :is-active="isActive(index, 'english')"
          :is-loading="false"
          language="english"
          @click="emit('sentence-click', index, 'english')"
        />
        <!-- French -->
        <SentenceCard
          :sentence="pair.french || 'Translating...'"
          :is-active="isActive(index, 'french')"
          :is-loading="isLoading(pair, 'french')"
          language="french"
          @click="emit('sentence-click', index, 'french')"
        />
      </div>
    </div>
  </div>
</template>
