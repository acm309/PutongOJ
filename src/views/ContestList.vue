<script setup>
import only from 'only'
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Input, Button, Page, Poptip, Spin } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import { onRouteQueryUpdate, purify } from '../util/helper'
import constant from '../util/constant'
import { useSessionStore } from '@/store/modules/session'
import { useContestStore } from '@/store/modules/contest'
import { useRootStore } from '@/store'
import { timePretty } from '@/util/formate'

const { t } = useI18n()
const { 'contestType': type, 'status': contestVisible } = constant
const contestStore = useContestStore()
const sessionStore = useSessionStore()
const rootStore = useRootStore()
const route = useRoute()
const router = useRouter()

const { list, sum } = $(storeToRefs(contestStore))
const { status, encrypt, currentTime } = $(storeToRefs(rootStore))
const { profile, isLogined, isAdmin, canRemove } = $(storeToRefs(sessionStore))
const page = $computed(() => Number.parseInt(route.query.page) || 1)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 20)
const $Message = inject('$Message')
const $Modal = inject('$Modal')
let enterPwd = $ref('')
const query = $computed(() => purify({ page, pageSize }))
const contestTitle = $ref('')

let loading = $ref(false)

const { find, verify, update, 'delete': remove } = contestStore

async function fetch() {
  loading = true
  await find(query)
  loading = false
}

function reload(payload = {}) {
  router.push({
    name: 'contestList',
    query: Object.assign({}, query, payload),
  })
}

const pageChange = val => reload({ page: val })

async function enter(item) {
  const opt = Object.assign(
    only(item, 'cid'),
    { pwd: enterPwd },
  )
  const data = await verify(opt)
  if (data)
    router.push({ name: 'contestOverview', params: { cid: item.cid } })
  else
    $Message.error('Wrong password!')
}

async function visit(item) {
  if (!isLogined) {
    sessionStore.toggleLoginState()
  } else if (isAdmin || profile.verifyContest.includes(+item.cid)) {
    router.push({ name: 'contestOverview', params: { cid: item.cid } })
  } else if (item.start > currentTime) {
    $Message.error('This contest hasn\'t started yet!')
  } else if (+item.encrypt === encrypt.Public) {
    router.push({ name: 'contestOverview', params: { cid: item.cid } })
  } else if (+item.encrypt === encrypt.Private) {
    const data = await verify(only(item, 'cid'))
    if (data)
      router.push({ name: 'contestOverview', params: { cid: item.cid } })
    else
      $Message.error('You\'re not invited to attend this contest!')
  } else if (+item.encrypt === encrypt.Password) {
    $Modal.confirm({
      render: (h) => {
        return h(Input, {
          placeholder: 'Please enter password.',
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

async function change(contest) {
  loading = true
  contest.status = contest.status === status.Reserve
    ? status.Available
    : status.Reserve
  await update(contest)
  find(query)
  loading = false
}

function del(cid) {
  $Modal.confirm({
    title: '提示',
    content: '<p>此操作将永久删除该文件, 是否继续?</p>',
    onOk: async () => {
      loading = true
      await remove({ cid })
      $Message.success(`成功删除 ${cid}！`)
      loading = false
    },
    onCancel: () => $Message.info('已取消删除！'),
  })
}

async function search() {
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
      <Page class="contest-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange" />
      <Page class="contest-page-simple" simple :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange" />
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
            <th class="contest-cid">CID</th>
            <th class="contest-title">Title</th>
            <th class="contest-status">Status</th>
            <th class="contest-type">Type</th>
            <th class="contest-start-time">Start Time</th>
            <th v-if="isAdmin" class="contest-visible">Visible</th>
            <th v-if="isAdmin && canRemove" class="contest-delete">Delete</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="list.length == 0" class="contest-empty">
            <td colspan="7">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="(item, index) in list" :key="index">
            <td class="contest-cid">{{ item.cid }}</td>
            <td class="contest-title">
              <Button type="text" class="table-button" @click="visit(item)">
                <span class="button-text">{{ item.title }}</span>
                <Poptip trigger="hover" v-show="item.status === status.Reserve"
                  content="This item is reserved, no one could see this, except admin" placement="top">
                  <Tag class="contest-mark">Reserved</Tag>
                </Poptip>
              </Button>
            </td>
            <td class="contest-status">
              <span v-if="item.start > currentTime" class="contest-status-ready">Ready</span>
              <span v-if="item.start < currentTime && item.end > currentTime" class="contest-status-run">Running</span>
              <span v-if="item.end < currentTime" class="contest-status-end">Ended</span>
            </td>
            <td class="contest-type">
              <span :class="{
                'contest-type-password': +item.encrypt === encrypt.Password,
                'contest-type-private': +item.encrypt === encrypt.Private,
                'contest-type-public': +item.encrypt === encrypt.Public,
              }">
                {{ type[item.encrypt] }}
              </span>
            </td>
            <td class="contest-start-time">{{ timePretty(item.start) }}</td>
            <td v-if="isAdmin" class="contest-visible">
              <Poptip trigger="hover" content="Click to change status" placement="right">
                <a @click="change(item)">{{ contestVisible[item.status] }}</a>
              </Poptip>
            </td>
            <td v-if="isAdmin && canRemove" class="contest-delete">
              <a @click="del(item.cid)">Delete</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="contest-footer">
      <Page class="contest-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator show-total
        @on-change="pageChange" />
      <Page class="contest-page-mobile" size="small" :model-value="page" :total="sum" :page-size="pageSize"
        show-elevator show-total @on-change="pageChange" />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../styles/common'

.contest-wrap
  width 100%
  margin 0 auto
  padding 40px 0

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
