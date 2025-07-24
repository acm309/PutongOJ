<script setup lang="ts">
import type { Message } from 'view-ui-plus'
import { storeToRefs } from 'pinia'
import { Divider, Form, FormItem, Input, Spin } from 'view-ui-plus'
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import CourseSelect from '@/components/CourseSelect.vue'
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

const loadingProblem = ref(false)
const transferring = ref(false)
const transferTo = ref('')

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
          <CourseSelect
            v-model="transferTo" :current="problem.course?.courseId ?? -1"
            placeholder="Select a course to transfer" :disabled="transferring" class="course-select"
          />
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
</style>
