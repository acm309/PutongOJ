<script setup>
import { storeToRefs } from 'pinia'
import { inject, onBeforeMount, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { onProfileUpdate, onRouteQueryUpdate, purify } from '@/util/helper'
import constant from '@/util/constant'
import { useSessionStore } from '@/store/modules/session'
import { useProblemStore } from '@/store/modules/problem'
import { useRootStore } from '@/store'
import { formate } from '@/util/formate'

const options = reactive([
  { value: 'pid', label: 'Pid' },
  { value: 'title', label: 'Title' },
  { value: 'tag', label: 'Tag' },
])

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

let type = $ref(route.query.type || 'pid')
let content = $ref(route.query.content || '')
const page = $computed(() => Number.parseInt(route.query.page) || 1)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 30)
const problemVisible = $ref(constant.status)
const query = $computed(() => purify({ type, content, page, pageSize }))

const problemStore = useProblemStore()
const rootStore = useRootStore()
const sessionStore = useSessionStore()

const { list, sum, solved } = $(storeToRefs(problemStore))
const { status, judge } = $(storeToRefs(rootStore))
const { isAdmin, canRemove } = $(storeToRefs(sessionStore))
const { find, update, 'delete': remove } = problemStore

let loading = $ref(false)

function reload(payload = {}) {
  const routeQuery = Object.assign({}, query, purify(payload))
  router.push({ name: 'problemList', query: routeQuery })
}

const fetch = async () => {
  loading = true
  type = route.query.type || 'pid'
  content = route.query.content || ''
  await find(query)
  loading = false
}

const search = () => reload({ page: 1, type, content })
const pageChange = val => reload({ page: val })

function change(problem) {
  loading = true
  problem.status = problem.status === status.Reserve ? status.Available : status.Reserve
  update(problem).then(fetch)
}

const $Message = inject('$Message')
const $Modal = inject('$Modal')

function del(pid) {
  $Modal.confirm({
    okText: t('oj.ok'),
    cancelText: t('oj.cancel'),
    title: t('oj.warning'),
    content: t('oj.will_remove_problem', { pid }),
    onOk: async () => {
      loading = true
      await remove({ pid })
      $Message.success(t('oj.remove_problem_success', { pid }))
      loading = false
    },
    onCancel: () => $Message.info(t('oj.cancel_remove')),
  })
}

onBeforeMount(fetch)
onRouteQueryUpdate(fetch)
onProfileUpdate(fetch)
</script>

<template>
  <div class="problem-list-wrap">
    <div class="problem-list-header">
      <Page class="problem-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange" />
      <Page class="problem-page-simple" simple :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange" />
      <div class="problem-list-filter">
        <Select v-model="type" class="search-type-select">
          <Option v-for="item in options" :key="item.value" :value="item.value">
            {{ item.label }}
          </Option>
        </Select>
        <Input v-model="content" class="search-input" @keyup.enter="search" clearable />
        <Button type="primary" class="search-button" @click="search">
          {{ t('oj.search') }}
        </Button>
      </div>
    </div>
    <div class="problem-table-container">
      <table class="problem-table">
        <thead>
          <tr>
            <th class="problem-status">#</th>
            <th class="problem-pid">PID</th>
            <th class="problem-title">Title</th>
            <th class="problem-tags">Tags</th>
            <th class="problem-ratio">Ratio</th>
            <th v-if="isAdmin" class="problem-visible">Visible</th>
            <th v-if="isAdmin && canRemove" class="problem-delete">Delete</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="list.length == 0" class="status-empty">
            <td colspan="7">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="item in list" :key="item.pid">
            <td class="problem-status">
              <Icon v-if="solved.includes(item.pid)" type="md-checkmark" />
            </td>
            <td class="problem-pid">{{ item.pid }}</td>
            <td class="problem-title">
              <router-link :to="{ name: 'problemInfo', params: { pid: item.pid } }">
                <Button type="text" class="table-button">{{ item.title }}</Button>
              </router-link>
            </td>
            <td class="problem-tags">
              <template v-for="(item2, index2) in item.tags" :key="index2">
                <router-link :to="{ name: 'problemList', query: { type: 'tag', content: item2 } }">
                  <Tag class="problem-tag">{{ item2 }}</Tag>
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
                <a @click="change(item)">{{ problemVisible[item.status] }}</a>
              </Tooltip>
            </td>
            <td v-if="isAdmin && canRemove" class="problem-delete">
              <a @click="del(item.pid)">Delete</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="problem-list-footer">
      <Page class="problem-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator show-total
        @on-change="pageChange" />
      <Page class="problem-page-mobile" size="small" :model-value="page" :total="sum" :page-size="pageSize" show-total
        show-elevator @on-change="pageChange" />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../styles/common'

.problem-list-wrap
  width 100%
  margin 0 auto
  padding 40px 0
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
    padding 20px 0
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
.problem-delete
  width 100px

.problem-tag
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
