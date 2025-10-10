<script setup lang="ts">
import type { ProblemEntityPreview } from '@backend/types/entity'
import type { Message } from 'view-ui-plus'
import type { FindProblemsParams } from '@/types/api'
import { storeToRefs } from 'pinia'
import { useConfirm } from 'primevue'
import { Button, Form, FormItem, Icon, Input, InputNumber, Modal, Option, Page, Select, Spin, Tag } from 'view-ui-plus'
import { inject, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { useRootStore } from '@/store'
import { useCourseStore } from '@/store/modules/course'
import { useProblemStore } from '@/store/modules/problem'
import { useSessionStore } from '@/store/modules/session'
import constant from '@/utils/constant'
import { formate } from '@/utils/formate'
import { onRouteQueryUpdate, purify } from '@/utils/helper'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const confirm = useConfirm()
const rootStore = useRootStore()
const sessionStore = useSessionStore()
const problemStore = useProblemStore()
const courseStore = useCourseStore()
const { status, judge } = $(storeToRefs(rootStore))
const { isAdmin } = storeToRefs(sessionStore)
const { problems, solved } = $(storeToRefs(problemStore))
const { course } = storeToRefs(courseStore)
const { findProblems, update } = problemStore

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

async function switchStatus (problem: ProblemEntityPreview) {
  loading = true
  const newStatus = problem.status === status.Reserve
    ? status.Available
    : status.Reserve
  await update({ pid: problem.pid, status: newStatus })
  loading = false
  await fetch()
}

const message = inject('$Message') as typeof Message

const sortingModal = ref(false)
const sorting = ref({} as ProblemEntityPreview)
const newPosition = ref<number | null>(null)

async function updateSorting () {
  if (newPosition.value === null || newPosition.value < 1 || newPosition.value > problems.total + 1) {
    message.error(t('oj.invalid_position'))
    return
  }
  loading = true
  try {
    await api.course.moveCourseProblem(
      course.value.courseId,
      sorting.value.pid,
      newPosition.value,
    )
    message.success(t('oj.problem_sorting_updated'))
    sortingModal.value = false
    await fetch()
  } catch (e: any) {
    message.error(t('oj.failed_to_update_sorting', { error: e.message }))
  } finally {
    loading = false
  }
}

function removeProblem (event: any, pid: number) {
  confirm.require({
    target: event.currentTarget,
    message: '你确定要从该课程中移除该题目吗？',
    rejectProps: {
      label: '取消',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: '确定',
      severity: 'danger',
    },
    accept: async () => {
      await api.course.removeCourseProblem(course.value.courseId, pid)
      message.success('题目已从课程中移除')
      fetch()
    },
  })
}

onBeforeMount(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="problem-list-wrap">
    <div class="problem-list-header">
      <Page
        class="problem-page-table" :model-value="page" :total="problems.total" :page-size="problems.limit"
        show-elevator @on-change="pageChange"
      />
      <Page
        class="problem-page-simple" :model-value="page" simple :total="problems.total" :page-size="problems.limit"
        show-elevator @on-change="pageChange"
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
            <th class="problem-id">
              {{ t('oj.id') }}
            </th>
            <th class="problem-pid">
              {{ t('oj.pid') }}
            </th>
            <th class="problem-title">
              {{ t('oj.title') }}
            </th>
            <th class="problem-tags">
              {{ t('oj.tags') }}
            </th>
            <th class="problem-ratio">
              {{ t('oj.ratio') }}
            </th>
            <th v-if="course.role.manageProblem" class="problem-visible">
              {{ t('oj.visible') }}
            </th>
            <th v-if="isAdmin" class="problem-sorting">
              {{ t('oj.sorting') }}
            </th>
            <th v-if="isAdmin" class="problem-remove">
              {{ t('oj.delete') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="problems.total === 0" class="status-empty">
            <td :colspan="6 + (course.role.manageProblem ? 1 : 0) + (isAdmin ? 1 : 0)">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="(item, index) in problems.docs" :key="item.pid">
            <td class="problem-status">
              <Icon v-if="solved.includes(item.pid)" type="md-checkmark" />
            </td>
            <td class="problem-id">
              {{ pageSize * (page - 1) + index + 1 }}
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
              <template v-for="(tag, tagIdx) in item.tags" :key="tagIdx">
                <Tag
                  class="problem-tag" :color="tag.color"
                  @click="reload({ page: 1, type: 'tag', content: tag.name })"
                >
                  {{ tag.name }}
                </Tag>
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
            <td v-if="course.role.manageProblem" class="problem-visible">
              <Tooltip :content="t('oj.click_to_change_status')" placement="right">
                <a :class="{ 'status-disabled': !(isAdmin || item.isOwner) }" @click="switchStatus(item)">
                  {{ problemStatus[item.status] }}
                </a>
              </Tooltip>
            </td>
            <td v-if="isAdmin" class="problem-sorting">
              <Button type="text" @click="sortingModal = true; sorting = item">
                {{ t('oj.move') }}
              </Button>
            </td>
            <td v-if="isAdmin" class="problem-remove">
              <Button type="text" @click="event => removeProblem(event, item.pid)">
                {{ t('oj.delete') }}
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="problem-list-footer">
      <Page
        class="problem-page-table" :model-value="page" :total="problems.total" :page-size="problems.limit"
        show-elevator show-total @on-change="pageChange"
      />
      <Page
        class="problem-page-mobile" :model-value="page" size="small" :total="problems.total"
        :page-size="problems.limit" show-totalshow-elevator @on-change="pageChange"
      />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
    <Modal v-model="sortingModal" :closable="false" :title="t('oj.update_problem_sorting')" @on-ok="updateSorting">
      <Form label-position="top" style="margin-bottom: -16px;">
        <FormItem :label="t('oj.move_problem')">
          <Input v-model="sorting.title" size="large" disabled />
        </FormItem>
        <FormItem :label="t('oj.before_position')">
          <InputNumber
            v-model="newPosition" size="large" :min="1" :max="problems.total + 1"
            :placeholder="t('oj.enter_new_position')" controls-outside style="width: 100%;"
          />
        </FormItem>
      </Form>
    </Modal>
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
.problem-id
  width 50px
  text-align right
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
  width 90px
.problem-sorting
  width 80px
  text-align center
.problem-remove
  width 110px
  text-align center
  padding-right 40px !important

.problem-tag
  margin-top: -2px
  cursor: pointer
.status-disabled
  color #b0b0b0
  cursor not-allowed

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
