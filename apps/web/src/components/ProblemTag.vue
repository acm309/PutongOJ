<script setup lang="ts">
import type { TagColor } from '@putongoj/shared'
import Tag from 'primevue/tag'

const props = withDefaults(defineProps<{
  name: string
  color?: TagColor
  size?: 'normal' | 'large'
  filled?: boolean
}>(), {
  color: 'default',
  size: 'normal',
  filled: true,
})
</script>

<template>
  <Tag
    :value="props.name" class="ptag" :class="[
      `ptag-${props.color}`,
      {
        'ptag-filled': props.filled,
        'ptag-large': props.size === 'large',
      },
    ]"
  />
</template>

<style scoped>
.ptag {
  color: var(--ptag-color);
  background: transparent;
  transition: background-color 0.3s;
}

.ptoj-dark .ptag {
  color: color-mix(in srgb, var(--ptag-color), white 10%);
}

.ptag-filled {
  background-color: color-mix(in srgb, var(--ptag-color), transparent 85%);
}

.ptoj-dark .ptag-filled {
  background-color: color-mix(in srgb, var(--ptag-color), transparent 90%);
}

.ptag-large {
  font-weight: 500;
  font-size: 14px;
  padding: 6px 12px;
}

.ptag-default {
  --ptag-color: oklch(55.4% 0.046 257.417);
}

.ptag-purple {
  --ptag-color: oklch(62.7% 0.265 303.9);
}

.ptag-geekblue {
  --ptag-color: oklch(58.5% 0.233 277.117);
}

.ptag-blue {
  --ptag-color: oklch(62.3% 0.214 259.815);
}

.ptag-cyan {
  --ptag-color: oklch(71.5% 0.143 215.221);
}

.ptag-green {
  --ptag-color: oklch(69.6% 0.17 162.48);
}

.ptag-lime {
  --ptag-color: oklch(76.8% 0.233 130.85);
}

.ptag-yellow {
  --ptag-color: oklch(79.5% 0.184 86.047);
}

.ptag-orange {
  --ptag-color: oklch(70.5% 0.213 47.604);
}

.ptag-red {
  --ptag-color: oklch(63.7% 0.237 25.331);
}
</style>
