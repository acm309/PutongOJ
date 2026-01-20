<script setup lang="ts">
import type { ContestEntityView } from '@backend/types/entity'
import { encrypt, status } from '@backend/utils/constants'
import { Alert, Button, Form, FormItem, Message, Space, Step, Steps } from 'view-ui-plus'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import ContestBasicEdit from '@/components/ContestBasicEdit.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const initialized = ref(false)
const contest = ref<any>({})

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
  if (!contest.value) {
    return
  }
  if (!contest.value.title.trim()) {
    Message.error(t('oj.title_is_required'))
    return
  }
  if (!contest.value.start || !contest.value.end) {
    Message.error(t('oj.time_is_required'))
    return
  }

  const resp = await api.contest.create({
    ...contest.value,
    cid: undefined,
    course: route.query.course
      ? Number.parseInt(route.query.course as string)
      : undefined,
  })

  Message.success(t('oj.create_contest_success', contest.value))
  router.push({ name: 'contestEdit', params: { contestId: resp.data.cid } })
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
      <ContestBasicEdit :contest="contest" />
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
