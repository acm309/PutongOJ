<script setup lang="ts">
import { tagColors } from '@backend/utils/constants'
import { storeToRefs } from 'pinia'
import { Tag } from 'view-ui-plus'
import { onMounted, ref, watch } from 'vue'
import { useTagStore } from '@/store/modules/tag'

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
  <div class="problem-tags-select">
    <template v-for="color in tagColors" :key="color">
      <Tag
        v-for="tag of (tagItemsGroupByColor[color] || [])" :key="tag.tagId" class="problem-tag" checkable
        :checked="selectedTags.includes(tag.tagId)" :color="color" @click="() => handleTagClick(tag.tagId)"
      >
        {{ tag.name }}
      </Tag>
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
  margin-right 6px
  line-height 20px !important
</style>
