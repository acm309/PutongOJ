<script setup lang="ts">
import { loadingBarState } from '@/composables/useLoadingBar'
</script>

<template>
  <div
    class="fixed h-0.5 left-0 top-0 transition-opacity w-full z-9999"
    :class="loadingBarState.show ? 'opacity-100' : 'opacity-0'"
  >
    <div
      class="ease-out h-full transition-[width]"
      :class="loadingBarState.status === 'error' ? 'bg-red-500' : 'bg-primary'"
      :style="{ width: `${loadingBarState.percent}%` }"
    />
  </div>
</template>
