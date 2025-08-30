<script setup lang="ts">
import type { ContestEntityView } from '@backend/types/entity'
import type { Message } from 'view-ui-plus'
import { encrypt, status } from '@backend/utils/constants'
import { storeToRefs } from 'pinia'
import { Alert, Form, FormItem, Space, Step, Steps } from 'view-ui-plus'
import { inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ContestBasicEdit from '@/components/ContestBasicEdit.vue'
import { useContestStore } from '@/store/modules/contest'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const contestStore = useContestStore()

const { create: createContest } = contestStore
const { contest } = storeToRefs(contestStore)
const message = inject('$Message') as typeof Message

const initialized = ref(false)

async function init (): Promise<void> {
  let now = new Date().getTime()
  now -= now % (5 * 60 * 1000)
  contest.value = {
    cid: -1,
    title: '',
    start: now,
    end: now + 60 * 1000 * 60,
    list: [],
    encrypt: encrypt.Public,
    status: status.Reserve,
    argument: '',
  } as any as ContestEntityView
  initialized.value = true
}

async function submit (): Promise<void> {
  if (!contest.value.title.trim()) {
    message.error(t('oj.title_is_required'))
    return
  }
  if (!contest.value.start || !contest.value.end) {
    message.error(t('oj.time_is_required'))
    return
  }

  const contestId = await createContest({
    ...contest.value,
    cid: undefined,
    course: route.query.course
      ? Number.parseInt(route.query.course as string)
      : undefined,
  })

  message.success(t('oj.create_contest_success', contest.value))
  router.push({ name: 'contestEdit', params: { cid: contestId } })
}
onMounted(init)
</script>

<template>
  <Space direction="vertical" :size="26" type="flex">
    <div style="font-size: 28px">
      {{ t('oj.create_contest') }}
    </div>
    <Steps direction="vertical">
      <Step :title="t('oj.difficulty')" :content="t('oj.difficulty_explanation')" status="process" />
      <Step
        :title="t('oj.correctness_of_the_problem')" :content="t('oj.correctness_of_the_problem_explanation')"
        status="process"
      />
    </Steps>
    <Alert show-icon style="margin-bottom: 0;">
      {{ t('oj.after_contest_created_notice') }}
    </Alert>
    <div v-if="initialized">
      <ContestBasicEdit :contest-id="-1" />
      <Form label-position="right" :label-width="120">
        <FormItem>
          <Button type="primary" size="large" @click="submit">
            {{ t('oj.submit') }}
          </Button>
        </FormItem>
      </Form>
    </div>
  </Space>
</template>
