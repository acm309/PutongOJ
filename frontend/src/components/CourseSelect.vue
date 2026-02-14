<script setup lang="ts">
import type { CourseEntityItem } from '@backend/types/entity'
import debounce from 'lodash.debounce'
import Select from 'primevue/select'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api'
import { useMessage } from '@/utils/message'

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
const message = useMessage()

const loading = ref(false)
const courseOptions = ref<{ value: number, label: string, disabled?: boolean }[]>([])

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
        disabled: item.courseId === props.current,
      })
    })
    courseOptions.value.push({
      value: -1,
      label: t('oj.unrelated_to_any_course'),
      disabled: false,
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
    v-model="value" class="course-select" filter :loading="loading" :options="courseOptions" option-label="label"
    option-value="value" option-disabled="disabled" :placeholder="t('oj.select_a_course')"
    @filter="(event: any) => findCourseOptions(event.value)"
  >
    <template #option="{ option }">
      <div class="flex items-center justify-between">
        <span>{{ option.label }}</span>
        <span v-if="option.value > 0" class="text-muted-color text-sm">{{ option.value }}</span>
      </div>
    </template>
  </Select>
</template>
