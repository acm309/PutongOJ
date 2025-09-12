<script setup>
import only from 'only'
import { storeToRefs } from 'pinia'
import { Button, Input, Page, Poptip, Spin } from 'view-ui-plus'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useRootStore } from '@/store'
import { useContestStore } from '@/store/modules/contest'
import { useSessionStore } from '@/store/modules/session'
import constant from '@/utils/constant'
import { timePretty } from '@/utils/formate'
import { onRouteQueryUpdate, purify } from '@/utils/helper'

const { t } = useI18n()
const { 'contestType': type, 'status': contestVisible } = constant
const contestStore = useContestStore()
const sessionStore = useSessionStore()
const rootStore = useRootStore()
const route = useRoute()
const router = useRouter()

const { list, sum } = $(storeToRefs(contestStore))
const { status, encrypt, currentTime } = $(storeToRefs(rootStore))
const { profile, isLogined, isAdmin } = $(storeToRefs(sessionStore))
const page = $computed(() => Number.parseInt(route.query.page) || 1)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 20)
const $Message = inject('$Message')
const $Modal = inject('$Modal')
let enterPwd = $ref('')
const courseId = $computed(() => Number.parseInt(route.params.id))
const query = $computed(() => purify({ page, pageSize, course: courseId }))
const contestTitle = $ref('')

let loading = $ref(false)

const { find, verify, update } = contestStore

async function fetch () {
  loading = true
  await find(query)
  loading = false
}

function reload (payload = {}) {
  router.push({
    name: 'contestList',
    query: Object.assign({}, query, payload),
  })
}

const pageChange = val => reload({ page: val })

async function visit (item) {
  if (!isLogined) {
    sessionStore.toggleLoginState()
  } else if (isAdmin || profile.verifyContest.includes(+item.cid)) {
    router.push({ name: 'contestOverview', params: { cid: item.cid } })
  } else if (item.start > currentTime) {
    $Message.error(t('oj.contest_not_started'))
  } else if (+item.encrypt === encrypt.Public) {
    router.push({ name: 'contestOverview', params: { cid: item.cid } })
  } else if (+item.encrypt === encrypt.Private) {
    const data = await verify(only(item, 'cid'))
    if (data)
      router.push({ name: 'contestOverview', params: { cid: item.cid } })
    else
      $Message.error(t('oj.not_invited_to_contest'))
  } else if (+item.encrypt === encrypt.Password) {
    $Modal.confirm({
      render: (h) => {
        return h(Input, {
          placeholder: t('oj.please_enter_password'),
          onChange: event => enterPwd = event.target.value,
          onEnter: () => {
            enter(item)
            $Modal.remove()
          },
        })
      },
      onOk: () => {
        enter(item)
      },
    })
  }
}

async function enter (item) {
  const opt = Object.assign(
    only(item, 'cid'),
    { pwd: enterPwd },
  )
  const data = await verify(opt)
  if (data)
    router.push({ name: 'contestOverview', params: { cid: item.cid } })
  else
    $Message.error(t('oj.wrong_password'))
}

async function change (contest) {
  loading = true
  contest.status = contest.status === status.Reserve
    ? status.Available
    : status.Reserve
  await update(contest)
  find(query)
  loading = false
}

async function search () {
  loading = true
  await find(Object.assign({}, query, {
    type: 'title',
    content: contestTitle,
  }))
  loading = false
}

fetch()
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="contest-wrap">
    <div class="contest-header">
      <Page
        class="contest-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange"
      />
      <Page
        class="contest-page-simple" simple :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange"
      />
      <div class="contest-filter">
        <Input v-model="contestTitle" :placeholder="t('oj.title')" class="search-input" clearable />
        <Button type="primary" class="contest-filter-button" @click="search">
          {{ t('oj.search') }}
        </Button>
      </div>
    </div>
    <div class="contest-table-container">
      <table class="contest-table">
        <thead>
          <tr>
            <th class="contest-cid">
              {{ t('oj.cid') }}
            </th>
            <th class="contest-title">
              {{ t('oj.title') }}
            </th>
            <th class="contest-status">
              {{ t('oj.status') }}
            </th>
            <th class="contest-type">
              {{ t('oj.type') }}
            </th>
            <th class="contest-start-time">
              {{ t('oj.start_time') }}
            </th>
            <th v-if="isAdmin" class="contest-visible">
              {{ t('oj.visible') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="list.length === 0" class="contest-empty">
            <td colspan="7">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="(item, index) in list" :key="index">
            <td class="contest-cid">
              {{ item.cid }}
            </td>
            <td class="contest-title">
              <Button type="text" class="table-button" @click="visit(item)">
                <span class="button-text">{{ item.title }}</span>
                <Poptip
                  v-show="item.status === status.Reserve" trigger="hover"
                  :content="t('oj.reserved_item_notice')" placement="top"
                >
                  <Tag class="contest-mark">
                    {{ t('oj.reserved') }}
                  </Tag>
                </Poptip>
              </Button>
            </td>
            <td class="contest-status">
              <span v-if="item.start > currentTime" class="contest-status-ready">{{ t('oj.ready') }}</span>
              <span v-if="item.start < currentTime && item.end > currentTime" class="contest-status-run">{{ t('oj.running') }}</span>
              <span v-if="item.end < currentTime" class="contest-status-end">{{ t('oj.ended') }}</span>
            </td>
            <td class="contest-type">
              <span
                :class="{
                  'contest-type-password': +item.encrypt === encrypt.Password,
                  'contest-type-private': +item.encrypt === encrypt.Private,
                  'contest-type-public': +item.encrypt === encrypt.Public,
                }"
              >
                {{ type[item.encrypt] }}
              </span>
            </td>
            <td class="contest-start-time">
              {{ timePretty(item.start) }}
            </td>
            <td v-if="isAdmin" class="contest-visible">
              <Poptip trigger="hover" :content="t('oj.click_to_change_status')" placement="right">
                <a @click="change(item)">{{ contestVisible[item.status] }}</a>
              </Poptip>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="contest-footer">
      <Page
        class="contest-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator show-total
        @on-change="pageChange"
      />
      <Page
        class="contest-page-mobile" size="small" :model-value="page" :total="sum" :page-size="pageSize"
        show-elevator show-total @on-change="pageChange"
      />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'

.contest-wrap
  width 100%
  margin 0 auto
  padding 0 0 40px

.contest-header
  padding 0 40px
  margin-bottom 25px
  display flex
  justify-content space-between
  align-items center

.contest-filter
  display flex
  align-items center
  .search-input
    width 200px
    margin-right 8px

.contest-page-simple, .contest-page-mobile
  display none

@media screen and (max-width: 1024px)
  .contest-wrap
    padding 20px 0
  .contest-header
    padding 0 20px
    margin-bottom 5px
    .contest-page-table
      display none !important
    .contest-page-simple
      display block
  .contest-footer
    padding 0 20px
    margin-top 20px !important

@media screen and (max-width: 768px)
  .contest-page-table, .contest-page-simple
    display none !important
  .contest-filter
    width 100%
    .search-input
      width 100%
  .contest-page-mobile
    display block

.contest-table-container
  overflow-x auto
  width 100%

.contest-table
  width 100%
  min-width 1024px
  table-layout fixed
  th, td
    padding 0 16px
    text-align left
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

.contest-cid
  width 90px
  text-align right !important
.contest-title
  text-align left
  .table-button
    text-align left
  .contest-mark
    margin 0px 0px 4px 8px
.contest-status, .contest-type
  text-align center !important
.contest-status
  width 90px
.contest-type
  width 120px
td.contest-status
  font-weight bold
.contest-start-time
  width 190px
td.contest-type
  font-weight 500
.contest-visible
  width 120px
.contest-delete
  width 100px

.contest-status-ready
  color blue
.contest-status-run
  color red
.contest-status-end
  color black

.contest-type-password
  color green
.contest-type-private
  color red

.contest-footer
  padding 0 40px
  margin-top 40px
  text-align center

.contest-empty
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
