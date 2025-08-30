<script setup lang="ts">
import type { Message } from 'view-ui-plus'
import { contestLabelingStyle } from '@backend/utils/constants'
import { storeToRefs } from 'pinia'
import { Divider, Form, FormItem, Input, Option, Select, Spin } from 'view-ui-plus'
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
  message.success(t('oj.update_contest_success', { cid }))
  router.push({ name: 'contestOverview', params: { cid } })
  await loadContest()
}

async function transferContest () {
  if (!transferTo.value) {
    message.error(t('oj.please_select_target_course'))
    return
  }
  transferring.value = true
  try {
    await api.contest.update({
      cid: contest.value.cid,
      course: transferTo.value,
    })
    message.success(t('oj.contest_transferred_successfully'))
    loadContest()
    transferTo.value = ''
  } catch (error: any) {
    message.error(error.message || t('oj.failed_to_transfer_contest'))
  } finally {
    transferring.value = false
  }
}

onMounted(async () => {
  if (contest.value?.cid !== paramCid.value) {
    await loadContest()
  }
  if (!contest.value.option) {
    contest.value.option = {
      labelingStyle: contestLabelingStyle.numeric,
    }
  }
  if (!contest.value.option.labelingStyle) {
    contest.value.option.labelingStyle = contestLabelingStyle.numeric
  }
})
</script>

<template>
  <div v-if="contest" class="conadd-wrap">
    <ContestBasicEdit :contest-id="contest.cid" />
    <Form :label-width="120">
      <FormItem :label="t('oj.labeling_style')">
        <Select v-model="contest.option.labelingStyle" class="contest-form-item">
          <Option :value="contestLabelingStyle.numeric">
            {{ t('oj.numeric') }}
          </Option>
          <Option :value="contestLabelingStyle.alphabetic">
            {{ t('oj.alphabetic') }}
          </Option>
        </Select>
      </FormItem>
      <FormItem>
        <Button type="primary" size="large" @click="submitForm">
          {{ t('oj.submit') }}
        </Button>
      </FormItem>
    </Form>
    <Divider simple class="divider">
      {{ t('oj.contest_problems') }}
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
        {{ t('oj.course_transfer') }}
      </Divider>
      <Form label-position="right" :label-width="120">
        <FormItem :label="t('oj.current_course')">
          <Input
            :placeholder="(contest as any).course?.name ?? t('oj.not_related_to_any_course')" class="contest-form-item"
            disabled
          >
            <template v-if="(contest as any).course" #prepend>
              <span class="course-tips">{{ (contest as any).course?.courseId }}</span>
            </template>
          </Input>
        </FormItem>
        <FormItem :label="t('oj.target_course')">
          <CourseSelect
            v-model="transferTo" :current="(contest as any).course?.courseId ?? -1"
            :placeholder="t('oj.select_course_to_transfer')" :disabled="transferring" class="contest-form-item"
          />
        </FormItem>
        <FormItem>
          <Button type="primary" size="large" :disabled="!transferTo" :loading="transferring" @click="transferContest">
            {{ t('oj.transfer') }}
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
.contest-form-item
  width 100%
  max-width: 384px
</style>
