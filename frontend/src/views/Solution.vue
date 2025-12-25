<script setup>
import { useClipboard } from '@vueuse/core'
import highlight from 'highlight.js/lib/core'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import { storeToRefs } from 'pinia'
import { Button, ButtonGroup, Col, Divider, Icon, Message, Modal, Numeral, Poptip, Row, Space, Spin } from 'view-ui-plus'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { useSolutionStore } from '@/store/modules/solution'
import constant from '@/utils/constant'
import emitter from '@/utils/emitter'
import { timePretty } from '@/utils/formate'
import { onRouteQueryUpdate, testcaseUrl } from '@/utils/helper'
import 'highlight.js/styles/atom-one-light.css'

highlight.registerLanguage('c', cpp)
highlight.registerLanguage('cpp', cpp)
highlight.registerLanguage('java', java)
highlight.registerLanguage('python', python)

const { t } = useI18n()
const result = $ref(constant.result)
const langHighlight = $ref(constant.languageHighlight)
const lang = $ref(constant.language)
const color = $ref(constant.color)

const session = useSessionStore()
const solutionStore = useSolutionStore()
const root = useRootStore()
const { findOne, updateSolution } = solutionStore
const { solution } = $(storeToRefs(solutionStore))
const { isAdmin, isRoot } = storeToRefs(session)
const route = useRoute()

const { copy } = useClipboard()

let loading = $ref(false)

function onCopy (content) {
  copy(content)
  Message.success(t('oj.copied'))
}

function prettyCode (code) {
  if (!code) return ''
  return highlight.highlight(`${code}`, {
    language: langHighlight[solution.language],
  }).value
}

async function fetch () {
  loading = true
  await findOne(route.params)
  root.changeDomTitle({ title: `Solution ${solution.pid}` })
  loading = false
}

const showRefresh = ref(false)

async function rejudge () {
  if (!isRoot.value) {
    return
  }
  Modal.confirm({
    title: 'Rejudge this solution?',
    content: 'This action will rejudge this solution using the latest problem data. '
      + 'All previous results will be truncated.',
    onOk: async () => {
      loading = true
      const res = await updateSolution({ judge: 11 })
      if (res.success) {
        Message.success('Rejudge request sent')
      } else {
        Message.error(res.message || 'Failed to send rejudge request')
      }
      showRefresh.value = true
      loading = false
    },
    okText: t('oj.ok'),
    cancelText: t('oj.cancel'),
  })
}

async function markAsSkipped () {
  if (!isRoot.value) {
    return
  }
  Modal.confirm({
    title: 'Mark this solution as Skipped?',
    content: 'This action will mark this solution as Skipped. '
      + 'All previous results will be truncated.',
    onOk: async () => {
      loading = true
      const res = await updateSolution({ judge: 12 })
      if (res.success) {
        Message.success('Marked as Skipped')
      } else {
        Message.error(res.message || 'Failed to mark as Skipped')
      }
      loading = false
    },
    okText: t('oj.ok'),
    cancelText: t('oj.cancel'),
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
    <Row class="solution-header" justify="end">
      <Col flex="auto" class="solution-header-col">
        <h1 class="solution-result">
          {{ result[solution.judge || 0] }}
        </h1>
        <Space direction="vertical">
          <Space class="solution-info" split wrap>
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
              <RouterLink :to="{ name: 'contestOverview', params: { cid: solution.mid } }">
                {{ solution.mid }}
              </RouterLink>
            </span>
          </Space>
          <Space class="solution-info" split wrap>
            <span>
              {{ t('oj.time_label') }}
              <Numeral :value="solution.time" format="0,0" /> <small>ms</small>
            </span>
            <span>
              {{ t('oj.memory_label') }}
              <Numeral :value="solution.memory" format="0,0" /> <small>KB</small>
            </span>
            <span>
              {{ lang[solution.language] }}
            </span>
            <span>
              {{ timePretty(solution.create) }}
            </span>
          </Space>
        </Space>
      </Col>
      <Col v-if="isRoot" flex="none" class="solution-header-col">
        <Space direction="vertical">
          <ButtonGroup style="float: right;">
            <Button v-if="showRefresh" @click="fetch">
              <Icon type="md-refresh" /> Refresh
            </Button>
            <Button type="primary" @click="rejudge">
              <Icon type="md-redo" /> Rejudge
            </Button>
          </ButtonGroup>
          <Button style="float: right;" @click="markAsSkipped">
            <Icon type="md-flag" /> Mark as Skipped
          </Button>
        </Space>
      </Col>
    </Row>
    <div class="testcase-table-container">
      <table class="testcase-table">
        <thead>
          <tr>
            <th class="testcase-uuid">
              {{ t('oj.uuid') }}
            </th>
            <th v-if="isAdmin" class="testcase-files">
              {{ t('oj.files') }}
            </th>
            <th class="testcase-time">
              Time
            </th>
            <th class="testcase-memory">
              Memory
            </th>
            <th class="testcase-result">
              {{ t('oj.result') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!(solution.testcases?.length > 0)" class="testcase-empty">
            <td :colspan="isAdmin ? 5 : 4">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="(item, index) in solution.testcases" :key="index">
            <td class="testcase-uuid">
              <Poptip trigger="hover" placement="right">
                <span><code>{{ item.uuid.slice(0, 8) }}</code></span>
                <template #content>
                  <code>{{ item.uuid }}</code>
                </template>
              </Poptip>
            </td>
            <td v-if="isAdmin" class="testcase-files">
              <Space :size="4">
                <a :href="testcaseUrl(solution.pid, item.uuid, 'in')" target="_blank">{{ t('oj.input') }}</a>
                <Divider type="vertical" />
                <a :href="testcaseUrl(solution.pid, item.uuid, 'out')" target="_blank">{{ t('oj.output') }}</a>
              </Space>
            </td>
            <td class="testcase-time">
              <Numeral :value="item.time" format="0,0" /> <small>ms</small>
            </td>
            <td class="testcase-memory">
              <Numeral :value="item.memory" format="0,0" /> <small>KB</small>
            </td>
            <td class="testcase-result" :class="[color[item.judge]]">
              {{ result[item.judge] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="solution-detail">
      <pre v-if="solution.error" class="error"><code>{{ solution.error }}</code></pre>
      <Button shape="circle" icon="ios-document-outline" @click="onCopy(solution.code)">
        {{ t('oj.click_to_copy_code') }}
      </Button>
      <pre><code v-html="prettyCode(solution.code)" /></pre>
      <div v-if="isAdmin && solution.sim && solution.simSolution">
        <Space split wrap>
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
        </Space>
        <pre><code v-html="prettyCode(solution.simSolution.code)" /></pre>
      </div>
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../styles/common'

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
    font-family var(--font-verdana)

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
