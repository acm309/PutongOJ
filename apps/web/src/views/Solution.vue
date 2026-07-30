<script setup lang="ts">
import type { Language, SubmissionStatusUpdatePayload } from '@putongoj/shared'
import { JudgeStatus } from '@putongoj/shared'
import { useClipboard } from '@vueuse/core'
import highlight from 'highlight.js/lib/core'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { useConfirm } from 'primevue/useconfirm'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { useSolutionStore } from '@/store/modules/solution'
import { judgeStatusLabels, languageHighlight, languageLabels } from '@/utils/constant'
import emitter from '@/utils/emitter'
import { getJudgeStatusClassname, thousandSeparator, timePretty } from '@/utils/format'
import { onRouteQueryUpdate, testcaseUrl } from '@/utils/helper'
import { useMessage } from '@/utils/message'
import 'highlight.js/styles/atom-one-light.css'

highlight.registerLanguage('c', cpp)
highlight.registerLanguage('cpp', cpp)
highlight.registerLanguage('java', java)
highlight.registerLanguage('python', python)

const { t } = useI18n()
const route = useRoute()
const message = useMessage()
const confirm = useConfirm()
const rootStore = useRootStore()
const sessionStore = useSessionStore()
const solutionStore = useSolutionStore()

const { submission } = storeToRefs(solutionStore)
const { isAdmin, isRoot } = storeToRefs(sessionStore)
const { copy } = useClipboard()
const showRefresh = ref(false)

const submissionId = computed(() => Number(route.params.submissionId))

function onCopy (content: string) {
  copy(content)
  message.success(t('oj.copied'))
}

function prettyCode (code: string, language: Language) {
  return highlight.highlight(code, {
    language: languageHighlight[language],
  }).value
}

function getJudgeStatusLabel (status: JudgeStatus) {
  return judgeStatusLabels[status]
}

async function fetch () {
  if (!Number.isInteger(submissionId.value) || submissionId.value <= 0) {
    return
  }

  const response = await solutionStore.findOne(submissionId.value)
  if (!response.success || !response.data) {
    message.error(t('ptoj.failed_fetch_data'), response.message)
    return
  }

  rootStore.changeDomTitle({ title: `Submission ${response.data.id}` })
}

function updateStatus (status: SubmissionStatusUpdatePayload['status'], successMessage: string) {
  if (!submission.value || !isRoot.value) {
    return
  }

  confirm.require({
    header: status === JudgeStatus.REJUDGE_PENDING ? 'Rejudge this submission?' : 'Mark this submission as skipped?',
    message: status === JudgeStatus.REJUDGE_PENDING
      ? 'This action will rejudge this submission using the latest problem data.'
      : 'This action will mark this submission as skipped.',
    acceptProps: { label: t('oj.ok') },
    rejectProps: {
      label: t('oj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    accept: async () => {
      const response = await solutionStore.updateStatus(submission.value!.id, status)
      if (!response.success) {
        message.error(t('ptoj.failed_proceed'), response.message)
        return
      }
      message.success(successMessage)
      showRefresh.value = true
    },
  })
}

emitter.on('submission-updated', (updatedSubmissionId) => {
  if (submissionId.value === updatedSubmissionId) {
    fetch()
  }
})

fetch()
onRouteQueryUpdate(fetch)
</script>

<template>
  <div v-if="submission" class="solution-wrap">
    <div class="flex justify-end solution-header">
      <div class="flex-1 solution-header-col">
        <h1 class="font-verdana solution-result">
          {{ judgeStatusLabels[submission.status] }}
        </h1>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap gap-4 solution-info">
            <span>
              {{ t('oj.problem_label') }}
              <RouterLink :to="{ name: 'problemInfo', params: { problemId: submission.problemId } }">
                {{ submission.problemId }}
              </RouterLink>
            </span>
            <span>
              {{ t('oj.author_label') }}
              <RouterLink :to="{ name: 'UserProfile', params: { username: submission.user.username } }">
                {{ submission.user.username }}
              </RouterLink>
            </span>
            <span v-if="submission.contestId">
              {{ t('oj.contest_label') }}
              <RouterLink :to="{ name: 'ContestOverview', params: { contestId: submission.contestId } }">
                {{ submission.contestId }}
              </RouterLink>
            </span>
          </div>
          <div class="flex flex-wrap gap-4 solution-info">
            <span>{{ t('oj.time_label') }} {{ thousandSeparator(submission.timeUsedMs) }} <small>ms</small></span>
            <span>{{ t('oj.memory_label') }} {{ thousandSeparator(submission.memoryUsedKb) }} <small>KB</small></span>
            <span>{{ languageLabels[submission.language] }}</span>
            <span>{{ timePretty(submission.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div v-if="isRoot" class="flex-none solution-header-col">
        <div class="flex flex-col gap-4 items-end">
          <ButtonGroup>
            <Button
              v-if="showRefresh" severity="secondary" outlined icon="pi pi-refresh" label="Refresh"
              @click="fetch"
            />
            <Button
              icon="pi pi-play" label="Rejudge"
              @click="updateStatus(JudgeStatus.REJUDGE_PENDING, 'Rejudge request sent')"
            />
          </ButtonGroup>
          <Button
            icon="pi pi-flag" label="Mark as Skipped" severity="secondary" outlined
            @click="updateStatus(JudgeStatus.SKIPPED, 'Marked as skipped')"
          />
        </div>
      </div>
    </div>

    <DataTable :value="submission.testcaseResults" class="whitespace-nowrap" :lazy="true" scrollable>
      <Column field="testcaseId" class="font-mono pl-6 text-center">
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-hashtag" />
          </span>
        </template>
        <template #body="{ data }">
          <span v-tooltip.right="data.testcaseId">{{ data.testcaseId.slice(0, 8) }}</span>
        </template>
      </Column>

      <Column v-if="isAdmin" field="files" :header="t('oj.files')">
        <template #body="{ data }">
          <div class="flex gap-4 items-center">
            <a :href="testcaseUrl(submission.problemId, data.testcaseId, 'in')" target="_blank">{{ t('oj.input') }}</a>
            <a :href="testcaseUrl(submission.problemId, data.testcaseId, 'out')" target="_blank">{{ t('oj.output') }}</a>
          </div>
        </template>
      </Column>

      <Column field="timeUsedMs" class="text-right">
        <template #header>
          <span class="font-semibold text-right w-full">
            {{ t('ptoj.time') }}
          </span>
        </template>
        <template #body="{ data }">
          {{ thousandSeparator(data.timeUsedMs) }} <small>ms</small>
        </template>
      </Column>

      <Column field="memoryUsedKb" class="text-right">
        <template #header>
          <span class="font-semibold text-right w-full">
            {{ t('ptoj.memory') }}
          </span>
        </template>
        <template #body="{ data }">
          {{ thousandSeparator(data.memoryUsedKb) }} <small>KB</small>
        </template>
      </Column>

      <Column field="status" class="pr-6 text-center">
        <template #header>
          <span class="font-semibold text-center w-full">
            {{ t('ptoj.judge_status') }}
          </span>
        </template>
        <template #body="{ data }">
          <span :class="getJudgeStatusClassname(data.status)">
            {{ getJudgeStatusLabel(data.status) }}
          </span>
        </template>
      </Column>

      <template #empty>
        <span class="px-2">
          {{ t('ptoj.empty_content_desc') }}
        </span>
      </template>
    </DataTable>

    <div class="solution-detail">
      <pre v-if="submission.errorMessage" class="error"><code>{{ submission.errorMessage }}</code></pre>
      <Button
        icon="pi pi-file" severity="secondary" outlined :label="t('oj.click_to_copy_code')"
        @click="onCopy(submission.sourceCode)"
      />
      <pre><code v-html="prettyCode(submission.sourceCode, submission.language)" /></pre>

      <div v-if="isAdmin && submission.similarity > 0 && submission.similarSubmission">
        <div class="flex flex-wrap gap-4">
          <span>
            {{ t('oj.similar_to') }}
            <RouterLink :to="{ name: 'solution', params: { submissionId: submission.similarSubmission.id } }">
              {{ submission.similarSubmission.id }}
            </RouterLink>
          </span>
          <span>{{ t('oj.similarity') }}: {{ submission.similarity }}%</span>
          <span>
            Author:
            <RouterLink :to="{ name: 'UserProfile', params: { username: submission.similarSubmission.user.username } }">
              {{ submission.similarSubmission.user.username }}
            </RouterLink>
          </span>
          <span>{{ timePretty(submission.similarSubmission.createdAt) }}</span>
        </div>
        <pre><code v-html="prettyCode(submission.similarSubmission.sourceCode, submission.language)" /></pre>
      </div>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.solution-wrap
  width 100%
  max-width 1024px
  padding 0

.solution-header
  padding 40px 40px 20px
  margin 0 -20px -20px 0
  .solution-header-col
    margin 0 20px 20px 0
  .solution-result
    font-size 28px
    font-weight bold
    margin-bottom 12px

.testcase-table-container
  overflow-x auto
  width 100%
.testcase-table
  width 100%
  min-width 640px
  table-layout fixed
  th, td
    padding 0 16px
  tbody tr
    transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7

.testcase-uuid
  padding-left 40px !important
  text-align left
.testcase-time, .testcase-memory
  width 100px
  text-align right
.testcase-result
  padding-right 50px !important
  text-align right

.testcase-empty
  &:hover
    background-color transparent !important
  td
    margin-bottom 20px
    padding 32px !important
    border-radius 4px
    text-align center
    .empty-icon
      display block
      font-size 32px

.solution-detail
  padding 40px
  margin -14px 0
  pre
    border: 1px solid #e040fb
    border-radius: 4px
    padding: 10px
    overflow-x auto
    &.error
      background-color: #FFF9C4

@media screen and (max-width: 1024px)
  .solution-header
    padding 20px 20px 10px
  .solution-detail
    padding 20px
</style>
