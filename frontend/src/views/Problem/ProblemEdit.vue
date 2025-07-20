<script setup lang="ts">
import type { CourseEntityItem } from '@backend/types/entity'
import type { Message } from 'view-ui-plus'
import debounce from 'lodash.debounce'
import { storeToRefs } from 'pinia'
import { Divider, Form, FormItem, Input, Spin } from 'view-ui-plus'
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import OjProblemEdit from '@/components/ProblemEdit.vue'
import { useProblemStore } from '@/store/modules/problem'
import { useSessionStore } from '@/store/modules/session'

const { t } = useI18n()

const problemStore = useProblemStore()
const sessionStore = useSessionStore()

const route = useRoute()
const router = useRouter()
const message = inject('$Message') as typeof Message

const { problem } = $(storeToRefs(problemStore))
const { findOne, update: updateProblem } = problemStore
const { isRoot } = $(storeToRefs(sessionStore))
const paramPid = computed(() => Number.parseInt(route.params.pid as string))

const loadingCourses = ref(false)
const loadingProblem = ref(false)
const transferring = ref(false)

const transferTo = ref('')
const courseOptions = ref<{ value: number, label: string }[]>([])

const findCourseOptions = debounce(async (query: string) => {
  if (query === 'Unrelated to any course') {
    return
  }
  loadingCourses.value = true
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
      label: 'Unrelated to any course',
    })
  } catch (error: any) {
    message.error(error.message || 'Failed to fetch courses')
  } finally {
    loadingCourses.value = false
  }
}, 500)

async function loadProblem () {
  loadingProblem.value = true
  await findOne({ pid: paramPid.value })
  loadingProblem.value = false
}

async function submitForm () {
  const data = await updateProblem(problem)
  message.success(t('oj.submit_success'))
  router.push({ name: 'problemInfo', params: { pid: data.pid } })
}

async function transferProblem () {
  if (!transferTo.value) {
    message.error('Please select a target course for transfer')
    return
  }
  transferring.value = true
  try {
    await api.problem.update({
      pid: problem.pid,
      course: transferTo.value,
    })
    message.success('Problem transferred successfully')
    loadProblem()
    transferTo.value = ''
  } catch (error: any) {
    message.error(error.message || 'Failed to transfer problem')
  } finally {
    transferring.value = false
  }
}

onMounted(() => {
  if (problem?.pid !== paramPid.value) {
    loadProblem()
  }
  findCourseOptions('')
})
</script>

<template>
  <div>
    <OjProblemEdit :problem="problem" />
    <Button type="primary" size="large" @click="submitForm">
      Submit
    </Button>
    <template v-if="isRoot">
      <Divider simple class="divider">
        Course Transfer
      </Divider>
      <Form label-position="right" :label-width="120">
        <FormItem label="Current Course">
          <Input :placeholder="problem.course?.name ?? 'Not related to any course'" class="course-select" disabled>
            <template v-if="problem.course" #prepend>
              <span class="course-tips">{{ problem.course?.courseId }}</span>
            </template>
          </Input>
        </FormItem>
        <FormItem label="Target Course">
          <Select
            v-model="transferTo" class="course-select" filterable clearable :remote-method="findCourseOptions"
            :loading="loadingCourses" :disabled="transferring" placeholder="Select a course to transfer"
          >
            <Option
              v-for="(option, index) in courseOptions" :key="index" :value="option.value" :label="option.label"
              :disabled="option.value === (problem.course?.courseId ?? -1)"
            >
              <span>{{ option.label }}</span>
              <span v-if="option.value > 0" class="course-tips">{{ option.value }}</span>
            </Option>
          </Select>
        </FormItem>
        <FormItem>
          <Button type="primary" size="large" :disabled="!transferTo" :loading="transferring" @click="transferProblem">
            Transfer
          </Button>
        </FormItem>
      </Form>
    </template>
    <Spin size="large" fix :show="loadingProblem" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
.divider
  margin 40px 0
.course-select
  max-width: 384px
  span.course-tips
    float: right
    color: #c5c8ce
</style>
