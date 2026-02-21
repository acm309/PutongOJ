<script setup lang="ts">
import { tagColors } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import { useTagStore } from '@/store/modules/tag'
import ProblemTag from './ProblemTag.vue'

const props = defineProps<{
  modelValue: number[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()

const tagStore = useTagStore()
const { tagItemsGroupByColor } = storeToRefs(tagStore)
const selectedTags = ref<number[]>(props.modelValue)

function handleTagClick (tagId: number) {
  const index = selectedTags.value.indexOf(tagId)
  if (index === -1) {
    selectedTags.value.push(tagId)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

onMounted(() => {
  tagStore.findTagItems()
})
watch(() => props.modelValue, (newVal) => {
  selectedTags.value = newVal
})
watch(selectedTags, (newVal) => {
  emit('update:modelValue', newVal)
})
</script>

<template>
  <div class="flex flex-wrap gap-1 problem-tags-select">
    <template v-for="color in tagColors" :key="color">
      <ProblemTag
        v-for="tag of (tagItemsGroupByColor[color] || [])" :key="tag.tagId" class="cursor-pointer problem-tag"
        :filled="selectedTags.includes(tag.tagId)" :color="color" :name="tag.name"
        @click="() => handleTagClick(tag.tagId)"
      />
    </template>
  </div>
</template>

<style lang="stylus" scoped>
.problem-tags-select
  width 100%
  border 1px solid #dcdee2
  border-radius 4px
  line-height 26px
  padding 8px 12px 10px

.problem-tag
  line-height 20px !important
</style>
