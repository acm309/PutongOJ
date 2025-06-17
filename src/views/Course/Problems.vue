<script setup lang="ts">
import type { FindProblemsParams } from '@/types/api'
import { storeToRefs } from 'pinia'
import { Button, Icon, Input, Option, Page, Select, Spin } from 'view-ui-plus'
import { onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useRootStore } from '@/store'
import { useProblemStore } from '@/store/modules/problem'
import { useSessionStore } from '@/store/modules/session'
import constant from '@/util/constant'
import { formate } from '@/util/formate'
import { onRouteQueryUpdate, purify } from '@/util/helper'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const problemStore = useProblemStore()
const rootStore = useRootStore()
const sessionStore = useSessionStore()
const { problems, solved } = $(storeToRefs(problemStore))
const { judge } = $(storeToRefs(rootStore))
const { isAdmin } = $(storeToRefs(sessionStore))
const { findProblems } = problemStore

const problemStatus = constant.status
const searchOptions = Object.freeze([
  { value: 'pid', label: 'Pid' },
  { value: 'title', label: 'Title' },
  { value: 'tag', label: 'Tag' },
])

const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 100

const page = $computed<number>(() =>
  Math.max(Number.parseInt(route.query.page as string) || 1, 1))
const pageSize = $computed<number>(() =>
  Math.max(Math.min(Number.parseInt(route.query.pageSize as string)
    || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE), 1))
const id = Number.parseInt(route.params.id as string)

const type = $ref(String(route.query.type || 'pid'))
const content = $ref(String(route.query.content || ''))
let loading = $ref(false)

const query = $computed<FindProblemsParams>(() => {
  return {
    page,
    pageSize,
    course: id,
    type: String(route.query.type || type),
    content: String(route.query.content || content),
  }
})

function reload (payload: Partial<FindProblemsParams> = {}) {
  const routeQuery = Object.assign(query, purify(payload))
  router.push({
    name: 'courseProblems',
    params: { id },
    query: routeQuery,
  })
}

async function fetch () {
  loading = true
  await findProblems(query)
  loading = false
}

const search = () => reload({ page: 1, type, content })
const pageChange = (val: number) => reload({ page: val })

onBeforeMount(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="problem-list-wrap">
    <div class="problem-list-header">
      <Page
        class="problem-page-table" :model-value="page"
        :total="problems.total" :page-size="problems.limit" show-elevator
        @on-change="pageChange"
      />
      <Page
        class="problem-page-simple" :model-value="page" simple
        :total="problems.total" :page-size="problems.limit" show-elevator
        @on-change="pageChange"
      />
      <div class="problem-list-filter">
        <Select v-model="type" class="search-type-select">
          <Option v-for="item in searchOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </Option>
        </Select>
        <Input v-model="content" class="search-input" clearable @keyup.enter="search" />
        <Button type="primary" class="search-button" @click="search">
          {{ t('oj.search') }}
        </Button>
      </div>
    </div>
    <div class="problem-table-container">
      <table class="problem-table">
        <thead>
          <tr>
            <th class="problem-status">
              #
            </th>
            <th class="problem-pid">
              PID
            </th>
            <th class="problem-title">
              Title
            </th>
            <th class="problem-tags">
              Tags
            </th>
            <th class="problem-ratio">
              Ratio
            </th>
            <th v-if="isAdmin" class="problem-visible">
              Visible
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="problems.total === 0" class="status-empty">
            <td colspan="7">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="item in problems.docs" :key="item.pid">
            <td class="problem-status">
              <Icon v-if="solved.includes(item.pid)" type="md-checkmark" />
            </td>
            <td class="problem-pid">
              {{ item.pid }}
            </td>
            <td class="problem-title">
              <router-link :to="{ name: 'problemInfo', params: { pid: item.pid } }">
                <Button type="text" class="table-button">
                  {{ item.title }}
                </Button>
              </router-link>
            </td>
            <td class="problem-tags">
              <template v-for="(item2, index2) in item.tags" :key="index2">
                <router-link :to="{ name: 'problems', query: { type: 'tag', content: item2 } }">
                  <span class="problem-tag">{{ item2 }}</span>
                </router-link>
              </template>
            </td>
            <td class="problem-ratio">
              <span>{{ formate(item.solve / (item.submit + 0.000001)) }}</span>&nbsp;
              (
              <router-link :to="{ name: 'status', query: { pid: item.pid, judge: judge.Accepted } }">
                {{ item.solve }}
              </router-link> /
              <router-link :to="{ name: 'status', query: { pid: item.pid } }">
                {{ item.submit }}
              </router-link>
              )
            </td>
            <td v-if="isAdmin" class="problem-visible">
              <Tooltip content="Click to change status" placement="right">
                <a>{{ problemStatus[item.status] }}</a>
              </Tooltip>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="problem-list-footer">
      <Page
        class="problem-page-table" :model-value="page"
        :total="problems.total" :page-size="problems.limit" show-elevator show-total
        @on-change="pageChange"
      />
      <Page
        class="problem-page-mobile" :model-value="page" size="small"
        :total="problems.total" :page-size="problems.limit" show-totalshow-elevator
        @on-change="pageChange"
      />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'

.problem-list-wrap
  width 100%
  margin 0 auto
  padding 0 0 40px
.problem-list-header
  padding 0 40px
  margin-bottom 25px
  display flex
  justify-content space-between
  .problem-page-table
    flex none
    display flex
  .problem-list-filter
    flex none
    display flex
  .problem-page-simple
    display none
.problem-list-footer
  padding 0 40px
  margin-top 40px
  text-align center
.problem-page-mobile
  display none

@media screen and (max-width: 1024px)
  .problem-list-wrap
    padding 0 0 20px
  .problem-list-header
    padding 0 20px
    margin-bottom 5px
    .problem-page-table
      display none !important
    .problem-page-simple
      display block
  .problem-status
    padding-left 20px
  .problem-list-footer
    padding 0 20px
    margin-top 20px

@media screen and (max-width: 768px)
  .problem-page-table, .problem-page-simple
    display none !important
  .problem-list-filter
    width 100%
    .search-input
      width 100%
  .problem-page-mobile
    display block

.search-type-select, .search-input, .search-button
  margin-left 4px
.search-type-select, .search-button
  width 80px
  min-width 80px
.search-input
  width 160px

.problem-table-container
  overflow-x auto
  width 100%
.problem-table
  width 100%
  min-width 1024px
  table-layout fixed
  th, td
    padding 0 16px
  tbody tr
    transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7
  .table-button
    padding 0
    border-width 0
    width 100%
    &:hover
      background-color transparent

.problem-status
  width 70px
  text-align center
  padding-left 40px !important
.problem-pid
  width 70px
  text-align right
.problem-title
  width 300px
  .table-button
    text-align left
.problem-tags
  text-align right
  white-space nowrap
  overflow-y scroll
  &::-webkit-scrollbar
    display: none
.problem-ratio
  width 200px
.problem-visible
  width 120px

.problem-tag
  display inline-block
  height 22px;
  line-height 22px;
  padding 0 8px
  border 1px solid #e8eaec
  border-radius 3px
  background #f7f7f7
  font-size 12px
  vertical-align middle
  color #515a6e
  margin 0px 0px 4px 8px

.status-empty
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
</style>
