<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  handle: string
  rating: number
}>()

const codeforcesTitle = computed(() => {
  if (props.rating >= 4000) return props.handle
  if (props.rating >= 3000) return 'Legendary Grandmaster'
  if (props.rating >= 2600) return 'International Grandmaster'
  if (props.rating >= 2400) return 'Grandmaster'
  if (props.rating >= 2300) return 'International Master'
  if (props.rating >= 2100) return 'Master'
  if (props.rating >= 1900) return 'Candidate Master'
  if (props.rating >= 1600) return 'Expert'
  if (props.rating >= 1400) return 'Specialist'
  if (props.rating >= 1200) return 'Pupil'
  return 'Newbie'
})
</script>

<template>
  <div
    class="font-verdana px-3.5 py-2" :class="{
      'text-color': props.rating >= 4000,
      'text-red-500': props.rating >= 2400 && props.rating < 4000,
      'text-amber-500': props.rating >= 2100 && props.rating < 2400,
      'text-fuchsia-600': props.rating >= 1900 && props.rating < 2100,
      'text-blue-600': props.rating >= 1600 && props.rating < 1900,
      'text-teal-500': props.rating >= 1400 && props.rating < 1600,
      'text-green-700': props.rating >= 1200 && props.rating < 1400,
      'text-neutral-500': props.rating < 1200,
    }"
  >
    <div class="font-semibold text-sm">
      {{ codeforcesTitle }}
    </div>
    <a
      :href="`https://codeforces.com/profile/${props.handle}`" target="_blank" rel="noopener noreferrer"
      class="font-sans font-semibold hover:underline text-2xl text-inherit"
    >
      <template v-if="props.rating >= 3000">
        <span
          :class="{
            'text-red-500': props.rating >= 4000,
            'text-color': props.rating >= 3000 && props.rating < 4000,
          }"
        >{{ props.handle.slice(0, 1) }}</span>{{ props.handle.slice(1) }}
      </template>
      <template v-else>{{ props.handle }}</template>
    </a>
    <div class="mt-1">
      <span class="mr-1 text-color">Contest rating:</span>
      <span class="font-bold font-verdana"> {{ props.rating }}</span>
    </div>
  </div>
</template>
