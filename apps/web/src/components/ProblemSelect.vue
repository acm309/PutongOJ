<script setup lang="ts">
import AutoComplete from 'primevue/autocomplete'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { findProblemItems } from '@/api/problem'
import { useMessage } from '@/utils/message'

interface ProblemOption { value: number, label: string }

interface Props {
  modelValue: number[] | null
  course?: number
}

const props = withDefaults(defineProps<Props>(), {
  course: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: number[] | null]
}>()

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const suggestions = ref<ProblemOption[]>([])
const selected = ref<ProblemOption[]>([])

watch(() => selected.value, (items) => {
  emit('update:modelValue', items.map(i => i.value))
}, { deep: true })

async function fetch (event: { query: string }) {
  loading.value = true
  try {
    const response = await findProblemItems({
      keyword: event.query,
      courseId: props.course,
    })
    if (!response.success) return
    suggestions.value = response.data.map(item => ({
      value: item.id,
      label: item.title,
    }))
  } catch (error: any) {
    suggestions.value = []
    message.error(error.message || t('oj.failed_to_fetch_problems'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AutoComplete
    v-model="selected" :suggestions="suggestions" option-label="label" :loading="loading"
    :placeholder="t('oj.search_problems_placeholder')" fluid multiple @complete="fetch"
  >
    <template #option="{ option }">
      <span class="mr-2 text-muted-color">[{{ option.value }}]</span>
      <span>{{ option.label }}</span>
    </template>
    <template #chip="{ value: chip }">
      <span class="gap-1 inline-flex items-center">
        <span class="text-muted-color">{{ chip.value }}</span>
        <span class="font-medium">{{ chip.label }}</span>
      </span>
    </template>
  </AutoComplete>
</template>
