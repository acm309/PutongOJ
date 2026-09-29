<script setup lang="ts">
import type { CourseEntityItem } from '@putong-oj/shared'
import { filterUnassigned } from '@putong-oj/shared'
import AutoComplete from 'primevue/autocomplete'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { findCourseItems, getCourse } from '@/api/course'
import { SEARCH_DEBOUNCE_MS } from '@/utils/constant'

const props = defineProps<{
  modelValue?: string
  disabled?: boolean
  placeholder?: string
  forceSelection?: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select'): void
}>()

const { t } = useI18n()

const loading = ref(false)
const courses = ref([] as CourseEntityItem[])
const selected = ref<CourseEntityItem | null>(null)

async function syncSelected (val?: string) {
  if (!val) {
    selected.value = null
    return
  }
  if (val === selected.value?.id) {
    return
  }
  const matched = courses.value.find(course => course.id === val)
  if (matched) {
    selected.value = matched
    return
  }
  if (val === filterUnassigned) {
    selected.value = { id: val, name: t('oj.unrelated_to_any_course') }
    return
  }

  selected.value = { id: val, name: val }
  const resp = await getCourse(val)
  if (resp.success && selected.value?.id === val) {
    selected.value = { id: val, name: resp.data.name }
  }
}

const value = computed({
  get: () => selected.value,
  set: (val: string | CourseEntityItem | null) => {
    selected.value = typeof val === 'string' ? { id: val, name: val } : val
    emit('update:modelValue', selected.value?.id || '')
  },
})

async function fetch (event: any) {
  loading.value = true
  const resp = await findCourseItems(event.query ?? '')
  const unassignedCourse = { id: filterUnassigned, name: t('oj.unrelated_to_any_course') }
  courses.value = resp.success ? [ ...resp.data, unassignedCourse ] : [ unassignedCourse ]
  if (selected.value) {
    selected.value = courses.value.find(course => course.id === selected.value?.id) ?? selected.value
  }
  loading.value = false
}

watch(() => props.modelValue, syncSelected, { immediate: true })
</script>

<template>
  <IconField>
    <AutoComplete
      v-model="value" :suggestions="courses" option-label="name" :disabled="props.disabled" :loading="loading"
      :placeholder="props.placeholder || t('ptoj.filter_by_course')" fluid :force-selection="props.forceSelection"
      :delay="SEARCH_DEBOUNCE_MS" @complete="fetch" @keypress.enter="emit('select')" @option-select="emit('select')"
    >
      <template #option="{ option }">
        {{ option.name }}
      </template>
    </AutoComplete>
    <InputIcon v-show="!loading" class="pi pi-book" />
  </IconField>
</template>
