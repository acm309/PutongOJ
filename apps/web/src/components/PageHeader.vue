<script setup lang="ts">
withDefaults(defineProps<{
  icon: string
  title: string
  bottomBorder?: boolean
}>(), {
  bottomBorder: false,
})
</script>

<template>
  <div class="p-6" :class="{ 'border-b border-surface': bottomBorder }">
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex font-semibold gap-4 items-center">
        <i class="p-[4.5px] text-2xl" :class="icon" />
        <h1 class="text-xl">
          {{ title }}
        </h1>
      </div>

      <div v-if="$slots.action" class="flex gap-2 items-center ml-auto">
        <slot name="action" />
      </div>
    </div>

    <div v-if="$slots.toolbar" class="mt-4">
      <slot name="toolbar" />
    </div>
  </div>
</template>
