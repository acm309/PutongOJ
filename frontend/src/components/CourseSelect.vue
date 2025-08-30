<script setup lang="ts">
import type { CourseEntityItem } from '@backend/types/entity'
import type { Message } from 'view-ui-plus'
import debounce from 'lodash.debounce'
import { Option, Select } from 'view-ui-plus'
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api'

const props = defineProps({
  modelValue: {
    type: [ Number, String ],
  },
  current: {
    type: Number,
    default: -1,
  },
})
const emit = defineEmits([ 'update:modelValue' ])
const { t } = useI18n()
const message = inject('$Message') as typeof Message

const loading = ref(false)
const courseOptions = ref<{ value: number, label: string }[]>([])

const findCourseOptions = debounce(async (query: string) => {
  query = query.trim()
  if (courseOptions.value.some(option => option.label === query)) {
    return
  }
  loading.value = true
  try {
    const { data } = await api.course.findCourseItems(query)
    courseOptions.value.length = 0
    data.forEach((item: CourseEntityItem) => {
      courseOptions.value.push({
        value: item.courseId,
        label: item.name,
      })
    })
    courseOptions.value.push({
      value: -1,
      label: t('oj.unrelated_to_any_course'),
    })
  } catch (error: any) {
    message.error(error.message || t('oj.failed_to_fetch_courses'))
  } finally {
    loading.value = false
  }
}, 500)

const value = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

watch(() => value.value, (val) => {
  if (val !== '') {
    return
  }
  findCourseOptions('')
})
onMounted(() => {
  findCourseOptions('')
})
</script>

<template>
  <Select
    v-model="value" class="course-select" filterable clearable :remote-method="findCourseOptions"
    :loading="loading" :placeholder="t('oj.select_a_course')"
  >
    <Option
      v-for="(option, index) in courseOptions" :key="index" :value="option.value" :label="option.label"
      :disabled="option.value === current"
    >
      <span>{{ option.label }}</span>
      <span v-if="option.value > 0" class="course-tips">{{ option.value }}</span>
    </Option>
  </Select>
</template>

<style lang="stylus" scoped>
.course-tips
  float: right
  color: #c5c8ce
</style>
