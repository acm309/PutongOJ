<script setup lang="ts">
import type { ProblemEntityItem } from '@backend/types/entity'
import type { Message } from 'view-ui-plus'
import debounce from 'lodash.debounce'
import { Form, FormItem, Modal, Option, Select } from 'view-ui-plus'
import { inject, ref, watch } from 'vue'
import api from '@/api'

const props = defineProps<{
  modelValue: boolean
  courseId: number
}>()
const emit = defineEmits([ 'update:modelValue', 'close' ])
const message = inject('$Message') as typeof Message

const modal = ref(false)
const loading = ref(false)
const options = ref<{ value: number, label: string }[]>([])
const selected = ref<number[]>([])

const findProblemOptions = debounce(async (query: string) => {
  query = query.trim()
  if (options.value.some(option => option.label === query)) {
    return
  }
  loading.value = true
  try {
    const { data } = await api.problem.findProblemItems(query)
    options.value.length = 0
    data.forEach((item: ProblemEntityItem) => {
      options.value.push({
        value: item.pid,
        label: item.title,
      })
    })
  } catch (error: any) {
    console.error(error.message || 'Failed to fetch problems')
  } finally {
    loading.value = false
  }
}, 500)

function close (added: number = 0) {
  emit('update:modelValue', false)
  emit('close', added)
  modal.value = false
  selected.value = []
  options.value = []
}

async function submit () {
  try {
    const { data: { added } } = await api.course.addProblems(props.courseId, selected.value)
    if (added > 0) {
      message.success(`Successfully added ${added} problem(s) to the course.`)
    } else {
      message.warning('No new problems were added.')
    }
    close(added)
  } catch (error: any) {
    console.error(`Failed to add problems: ${error.message}`)
    close()
  }
}

watch(() => props.modelValue, (val) => {
  modal.value = val
})
</script>

<template>
  <Modal
    v-model="modal" :loading="true" title="Add Course Problems" :closable="false" @on-cancel="close"
    @on-ok="submit"
  >
    <Form>
      <FormItem label="Problems to Add">
        <Select
          v-model="selected" multiple filterable :remote-method="findProblemOptions" :loading="loading"
          placeholder="Search problems by ID or title"
        >
          <Option v-for="(option, index) in options" :key="index" :value="option.value">
            <span class="problem-sep">[</span>
            <span class="problem-id">{{ option.value }}</span>
            <span class="problem-sep">] </span>
            <span>{{ option.label }}</span>
          </Option>
        </Select>
      </FormItem>
    </Form>
  </Modal>
</template>

<style lang="stylus" scoped>
.problem-id
  color: #c5c8ce
  margin-right: 8px
.problem-sep
  display: none
</style>
