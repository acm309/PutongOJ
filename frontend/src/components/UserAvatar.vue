<script lang="ts" setup>
import Avatar from 'primevue/avatar'
import defaultAvatar from '@/assets/logo.jpg'

const props = defineProps<{
  image?: string
  shape?: 'circle' | 'square'
  size?: 'normal' | 'large' | 'xlarge'
}>()
</script>

<template>
  <Avatar class="border border-surface overflow-clip" :image="props.image || defaultAvatar" :shape="props.shape" :size="props.size" />
</template>
