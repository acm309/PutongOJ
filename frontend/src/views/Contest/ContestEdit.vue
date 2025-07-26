<script setup lang="ts">
import type { Message } from 'view-ui-plus'
import { storeToRefs } from 'pinia'
import { Divider, Form, FormItem, Input, Spin } from 'view-ui-plus'
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import ContestBasicEdit from '@/components/ContestBasicEdit.vue'
import OjContestEdit from '@/components/ContestEdit.vue'
import CourseSelect from '@/components/CourseSelect.vue'
import { useContestStore } from '@/store/modules/contest'
import { useSessionStore } from '@/store/modules/session'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const contestStore = useContestStore()
const sessionStore = useSessionStore()
const message = inject('$Message') as typeof Message

const { overview, contest } = storeToRefs(contestStore)
const { update: updateContest, findOne } = contestStore
const { isRoot } = storeToRefs(sessionStore)
const paramCid = computed(() => Number.parseInt(route.params.cid as string))

const loadingContest = ref(false)
const transferring = ref(false)
const transferTo = ref('')

async function loadContest () {
  loadingContest.value = true
  await findOne({ cid: paramCid.value })
  loadingContest.value = false
}

async function submitForm () {
  const cid = await updateContest(contest.value)
  message.success(`update contest ${cid} success!`)
  router.push({ name: 'contestOverview', params: { cid } })
  await loadContest()
}

async function transferContest () {
  if (!transferTo.value) {
    message.error('Please select a target course for transfer')
    return
  }
  transferring.value = true
  try {
    await api.contest.update({
      cid: contest.value.cid,
      course: transferTo.value,
    })
    message.success('Contest transferred successfully')
    loadContest()
    transferTo.value = ''
  } catch (error: any) {
    message.error(error.message || 'Failed to transfer contest')
  } finally {
    transferring.value = false
  }
}

onMounted(() => {
  if (contest.value?.cid !== paramCid.value) {
    loadContest()
  }
})
</script>

<template>
  <div v-if="contest" class="conadd-wrap">
    <ContestBasicEdit :contest-id="contest.cid" />
    <Form :label-width="120">
      <FormItem>
        <Button type="primary" size="large" @click="submitForm">
          {{ t('oj.submit') }}
        </Button>
      </FormItem>
    </Form>
    <Divider simple class="divider">
      Contest Problems
    </Divider>
    <OjContestEdit :contest="contest" :overview="overview" />
    <Form :label-width="120">
      <FormItem>
        <Button type="primary" size="large" @click="submitForm">
          {{ t('oj.submit') }}
        </Button>
      </FormItem>
    </Form>
    <template v-if="isRoot">
      <Divider simple class="divider">
        Course Transfer
      </Divider>
      <Form label-position="right" :label-width="120">
        <FormItem label="Current Course">
          <Input :placeholder="(contest as any).course?.name ?? 'Not related to any course'" class="course-select" disabled>
            <template v-if="(contest as any).course" #prepend>
              <span class="course-tips">{{ (contest as any).course?.courseId }}</span>
            </template>
          </Input>
        </FormItem>
        <FormItem label="Target Course">
          <CourseSelect
            v-model="transferTo" :current="(contest as any).course?.courseId ?? -1"
            placeholder="Select a course to transfer" :disabled="transferring" class="course-select"
          />
        </FormItem>
        <FormItem>
          <Button type="primary" size="large" :disabled="!transferTo" :loading="transferring" @click="transferContest">
            Transfer
          </Button>
        </FormItem>
      </Form>
    </template>
    <Spin size="large" fix :show="loadingContest" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
.conadd-wrap
  padding-top 20px
.divider
  margin 40px 0
.course-select
  width 100%
  max-width: 384px
</style>
