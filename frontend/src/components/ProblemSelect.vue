<script setup lang="ts">
import type { ProblemEntityItem } from '@backend/types/entity'
import type { Message } from 'view-ui-plus'
import debounce from 'lodash.debounce'
import { Option, Select } from 'view-ui-plus'
import { computed, inject, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api'

interface Props {
  modelValue: number | number[]
  multiple?: boolean
  course?: number
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  course: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[]]
}>()

const { t } = useI18n()
const message = inject('$Message') as typeof Message

const loading = ref(false)
const options = ref<{ value: number, label: string }[]>([])
const lastQuery = ref('')

const value = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const findProblemOptions = debounce(async (query: string) => {
  query = query.trim()
  if (options.value.some(option => `[${option.value}] ${option.label}` === query)) {
    return
  }
  if (query === lastQuery.value) {
    return
  }
  lastQuery.value = query
  loading.value = true
  try {
    const { data } = await api.problem.findProblemItems({
      keyword: query,
      course: props.course,
    })
    options.value.length = 0
    data.forEach((item: ProblemEntityItem) => {
      options.value.push({
        value: item.pid,
        label: item.title,
      })
    })
  } catch (error: any) {
    message.error(error.message || t('oj.failed_to_fetch_problems'))
  } finally {
    loading.value = false
  }
}, 500)

function selectTopOption () {
  if (props.multiple) {
    return
  }
  if (options.value.length > 0) {
    value.value = options.value[0].value
    return
  }
  if (Number.isInteger(Number(lastQuery.value))) {
    value.value = Number(lastQuery.value)
  }
}

watch(() => props.multiple, (isMultiple) => {
  value.value = isMultiple ? [] : 0
})
</script>

<template>
  <Select
    v-model="value" :multiple="multiple" filterable :remote-method="findProblemOptions" :loading="loading"
    :placeholder="t('oj.search_problems_placeholder')" @keyup.enter="selectTopOption"
  >
    <Option v-for="(option, index) in options" :key="index" :value="option.value">
      <span class="problem-sep">[</span>
      <span class="problem-id">{{ option.value }}</span>
      <span class="problem-sep">] </span>
      <span>{{ option.label }}</span>
    </Option>
  </Select>
</template>

<style lang="stylus" scoped>
.problem-id
  color: #c5c8ce
  margin-right: 8px
.problem-sep
  display: none
</style>
