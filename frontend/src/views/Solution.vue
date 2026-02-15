<script setup>
import { useClipboard } from '@vueuse/core'
import highlight from 'highlight.js/lib/core'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Column from 'primevue/column'
// optional
import DataTable from 'primevue/datatable'
// optional
import { useConfirm } from 'primevue/useconfirm'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { useSolutionStore } from '@/store/modules/solution'
import constant, { judgeStatusLabels } from '@/utils/constant'
import emitter from '@/utils/emitter'
import {
  getJudgeStatusClassname,
  thousandSeparator,
  timePretty,
} from '@/utils/format'
import { onRouteQueryUpdate, testcaseUrl } from '@/utils/helper'
import { useMessage } from '@/utils/message'
import 'highlight.js/styles/atom-one-light.css'

highlight.registerLanguage('c', cpp)
highlight.registerLanguage('cpp', cpp)
highlight.registerLanguage('java', java)
highlight.registerLanguage('python', python)

const { t } = useI18n()
const message = useMessage()
const result = $ref(constant.result)
const langHighlight = $ref(constant.languageHighlight)
const lang = $ref(constant.language)

const session = useSessionStore()
const solutionStore = useSolutionStore()
const root = useRootStore()
const { findOne, updateSolution } = solutionStore
const { solution } = $(storeToRefs(solutionStore))
const { isAdmin, isRoot } = storeToRefs(session)
const route = useRoute()

const { copy } = useClipboard()
const confirm = useConfirm()

function onCopy (content) {
  copy(content)
  message.success(t('oj.copied'))
}

function prettyCode (code) {
  if (!code) return ''
  return highlight.highlight(`${code}`, {
    language: langHighlight[solution.language],
  }).value
}

async function fetch () {
  await findOne(route.params)
  root.changeDomTitle({ title: `Solution ${solution.pid}` })
}

const showRefresh = ref(false)

async function rejudge () {
  if (!isRoot.value) {
    return
  }
  confirm.require({
    header: 'Rejudge this solution?',
    message: 'This action will rejudge this solution using the latest problem data. '
      + 'All previous results will be truncated.',
    acceptProps: {
      label: t('oj.ok'),
    },
    rejectProps: {
      label: t('oj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    accept: async () => {
      const res = await updateSolution({ judge: 11 })
      if (res.success) {
        message.success('Rejudge request sent')
      } else {
        message.error(res.message || 'Failed to send rejudge request')
      }
      showRefresh.value = true
    },
  })
}

async function markAsSkipped () {
  if (!isRoot.value) {
    return
  }
  confirm.require({
    header: 'Mark this solution as Skipped?',
    message: 'This action will mark this solution as Skipped. '
      + 'All previous results will be truncated.',
    acceptProps: {
      label: t('oj.ok'),
    },
    rejectProps: {
      label: t('oj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    accept: async () => {
      const res = await updateSolution({ judge: 12 })
      if (res.success) {
        message.success('Marked as Skipped')
      } else {
        message.error(res.message || 'Failed to mark as Skipped')
      }
    },
  })
}

emitter.on('submission-updated', (sid) => {
  if (Number(route.params.sid) === sid) {
    fetch()
  }
})

fetch()
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="solution-wrap">
    <div class="flex justify-end solution-header">
      <div class="flex-1 solution-header-col">
        <h1 class="font-verdana solution-result">
          {{ result[solution.judge || 0] }}
        </h1>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap gap-4 solution-info">
            <span>
              {{ t('oj.problem_label') }}
              <RouterLink v-if="solution.pid" :to="{ name: 'problemInfo', params: { pid: solution.pid } }">
                {{ solution.pid }}
              </RouterLink>
            </span>
            <span>
              {{ t('oj.author_label') }}
              <RouterLink v-if="solution.uid" :to="{ name: 'UserProfile', params: { uid: solution.uid } }">
                {{ solution.uid }}
              </RouterLink>
            </span>
            <span v-if="solution.mid > 0">
              {{ t('oj.contest_label') }}
              <RouterLink :to="{ name: 'ContestOverview', params: { contestId: solution.mid } }">
                {{ solution.mid }}
              </RouterLink>
            </span>
          </div>
          <div class="flex flex-wrap gap-4 solution-info">
            <span>
              {{ t('oj.time_label') }}
              {{ thousandSeparator(solution.time) }} <small>ms</small>
            </span>
            <span>
              {{ t('oj.memory_label') }}
              {{ thousandSeparator(solution.memory) }} <small>KB</small>
            </span>
            <span>
              {{ lang[solution.language] }}
            </span>
            <span>
              {{ timePretty(solution.create) }}
            </span>
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
            <Button icon="pi pi-play" label="Rejudge" @click="rejudge" />
          </ButtonGroup>
          <Button icon="pi pi-flag" label="Mark as Skipped" severity="secondary" outlined @click="markAsSkipped" />
        </div>
      </div>
    </div>

    <DataTable :value="solution.testcases" class="whitespace-nowrap" :lazy="true" scrollable>
      <Column field="uuid" class="font-mono pl-6 text-center">
        <template #header>
          <span class="text-center w-full">
            <i class="pi pi-hashtag" />
          </span>
        </template>
        <template #body="{ data }">
          <span v-tooltip.right="data.uuid">{{ data.uuid.slice(0, 8) }}</span>
        </template>
      </Column>

      <Column v-if="isAdmin" field="files" :header="t('oj.files')">
        <template #body="{ data }">
          <div class="flex gap-4 items-center">
            <a :href="testcaseUrl(solution.pid, data.uuid, 'in')" target="_blank">{{ t('oj.input') }}</a>
            <a :href="testcaseUrl(solution.pid, data.uuid, 'out')" target="_blank">{{ t('oj.output') }}</a>
          </div>
        </template>
      </Column>

      <Column field="time" class="text-right">
        <template #header>
          <span class="font-semibold text-right w-full">
            {{ t('ptoj.time') }}
          </span>
        </template>
        <template #body="{ data }">
          {{ thousandSeparator(data.time) }} <small>ms</small>
        </template>
      </Column>

      <Column field="memory" class="text-right">
        <template #header>
          <span class="font-semibold text-right w-full">
            {{ t('ptoj.memory') }}
          </span>
        </template>
        <template #body="{ data }">
          {{ thousandSeparator(data.memory) }} <small>KB</small>
        </template>
      </Column>

      <Column field="judge" class="pr-6 text-center">
        <template #header>
          <span class="font-semibold text-center w-full">
            {{ t('ptoj.judge_status') }}
          </span>
        </template>
        <template #body="{ data }">
          <span :class="getJudgeStatusClassname(data.judge)">
            {{ judgeStatusLabels[data.judge] }}
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
      <pre v-if="solution.error" class="error"><code>{{ solution.error }}</code></pre>
      <Button
        icon="pi pi-file" severity="secondary" outlined :label="t('oj.click_to_copy_code')"
        @click="onCopy(solution.code)"
      />
      <pre><code v-html="prettyCode(solution.code)" /></pre>
      <div v-if="isAdmin && solution.sim && solution.simSolution">
        <div class="flex flex-wrap gap-4">
          <span>
            {{ t('oj.similar_to') }}
            <RouterLink :to="{ name: 'solution', params: { sid: solution.simSolution.sid } }">
              {{ solution.simSolution.sid }}
            </RouterLink>
          </span>
          <span>
            {{ t('oj.similarity') }}: {{ solution.sim }}{{ "%" }} <br>
          </span>
          <span>
            Author:
            <RouterLink :to="{ name: 'UserProfile', params: { uid: solution.simSolution.uid } }">
              {{ solution.simSolution.uid }}
            </RouterLink>
          </span>
          <span>{{ timePretty(solution.simSolution.create) }}</span>
        </div>
        <pre><code v-html="prettyCode(solution.simSolution.code)" /></pre>
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
