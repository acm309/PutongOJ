<script setup lang="ts">
import InputSwitch from 'primevue/inputswitch'

const props = defineProps<{
  label: string
  description: string
}>()

const modelValue = defineModel<boolean>()
</script>

<template>
  <div
    class="bg-(--p-inputtext-background) border border-(--p-inputtext-border-color) flex hover:border-(--p-inputtext-hover-border-color) items-center justify-between pl-3 pr-4 py-2 rounded-lg shadow-(--p-inputtext-shadow) transition-colors"
  >
    <div class="flex flex-col">
      <span class="font-medium">{{ props.label }}</span>
      <span class="text-muted-color text-xs">{{ props.description }}</span>
    </div>
    <InputSwitch v-model="modelValue" />
  </div>
</template>
