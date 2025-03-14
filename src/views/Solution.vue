<script setup>
import highlight from 'highlight.js/lib/core'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import 'highlight.js/styles/atom-one-light.css'

import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import constant from '@/util/constant'
import { useSessionStore } from '@/store/modules/session'
import { testcaseUrl } from '@/util/helper'
import { useRootStore } from '@/store'
import { useSolutionStore } from '@/store/modules/solution'

import { Card, Space, Button, Spin, Divider, Badge, Icon, Poptip } from 'view-ui-plus'

highlight.registerLanguage('c', cpp)
highlight.registerLanguage('cpp', cpp)
highlight.registerLanguage('java', java)
highlight.registerLanguage('python', python)

const { t } = useI18n()
const result = $ref(constant.result)
const lang = $ref(constant.languageHighlight)
const color = $ref(constant.color)

const session = useSessionStore()
const solutionStore = useSolutionStore()
const root = useRootStore()
const { findOne } = solutionStore
const { solution } = $(storeToRefs(solutionStore))
const { isAdmin } = storeToRefs(session)
const route = useRoute()

const $Message = inject('$Message')
const { copy } = useClipboard()

let loading = $ref(false)

function onCopy(content) {
  copy(content)
  $Message.success('Copied!')
}

function prettyCode(code) {
  if (!code) return ''
  return highlight.highlight(`${code}`, {
    language: lang[solution.language],
  }).value
}

async function fetch() {
  loading = true
  await findOne(route.params)
  root.changeDomTitle({ title: `Solution ${solution.pid}` })
  loading = false
}

fetch()
</script>

<template>
  <div class="solution-wrap">
    <Card class="solution-overview" dis-hover>
      <div class="solution-result">{{ result[solution.judge || 0] }}</div>
      <Space class="solution-info" :size="4">
        <span>Problem:
          <router-link v-if="solution.pid" :to="{ name: 'problemInfo', params: { pid: solution.pid } }">
            {{ solution.pid }}
          </router-link>
        </span>
        <Divider type="vertical" />
        <span>Author:
          <router-link v-if="solution.uid" :to="{ name: 'userProfile', params: { uid: solution.uid } }">
            {{ solution.uid }}
          </router-link>
        </span>
        <Divider type="vertical" />
        <span>Memory: {{ solution.memory }}KB</span>
        <Divider type="vertical" />
        <span>Time: {{ solution.time }}ms</span>
      </Space>
    </Card>
    <div class="testcase-table-container">
      <table class="testcase-table">
        <thead>
          <tr>
            <th class="testcase-uuid">UUID</th>
            <th class="testcase-files" v-if="isAdmin">Files</th>
            <th class="testcase-time">
              <Badge>Time<template #count><span class="testcase-badge">(ms)</span></template></Badge>
            </th>
            <th class="testcase-memory">
              <Badge>Memory<template #count><span class="testcase-badge">(KB)</span></template></Badge>
            </th>
            <th class="testcase-result">Result</th>
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
            <td class="testcase-files" v-if="isAdmin">
              <Space :size="4">
                <a :href="testcaseUrl(solution.pid, item.uuid, 'in')" target="_blank">Input</a>
                <Divider type="vertical" />
                <a :href="testcaseUrl(solution.pid, item.uuid, 'out')" target="_blank">Output</a>
              </Space>
            </td>
            <td class="testcase-time">{{ item.time }}</td>
            <td class="testcase-memory">{{ item.memory }}</td>
            <td :class="['testcase-result', color[item.judge]]">{{ result[item.judge] }}</td>
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
        <hr>
        {{ t('oj.similarity') }}: {{ solution.sim }}{{ "%" }} <br>
        From: {{ solution.simSolution.sid }} by
        <router-link :to="{ name: 'userProfile', params: { uid: solution.simSolution.uid } }">
          {{ solution.simSolution.uid }}
        </router-link>
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

.solution-overview
  margin 40px 40px 12px
  padding 10px
  .solution-result
    font-size 24px
    font-weight bold
    margin 10px 0
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
.testcase-badge
  position absolute
  font-size 8px
  top 10px
  right 8px
.testcase-result
  padding-right 40px !important
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
    &.error
      background-color: #FFF9C4

@media screen and (max-width: 1024px)
  .solution-overview
    margin 20px 20px 6px
  .solution-detail
    padding 20px
</style>
