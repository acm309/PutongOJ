<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import constant from '@/util/constant'
import { onRouteQueryUpdate, purify } from '@/util/helper'
import { useSessionStore } from '@/store/modules/session'
import { useSolutionStore } from '@/store/modules/solution'
import { timePretty } from '@/util/formate'

import { Badge, Poptip, Tag, Button, Input, Select, Option, Page } from 'view-ui-plus'

const { t } = useI18n()
const sessionStore = useSessionStore()
const solutionStore = useSolutionStore()
const { profile, isAdmin } = $(storeToRefs(sessionStore))
const { list, sum } = $(storeToRefs(solutionStore))
const find = solutionStore.find
const route = useRoute()
const router = useRouter()

let uid = $ref(route.query.uid || '')
let pid = $ref(route.query.pid || '')
let judge = $ref(Number.parseInt(route.query.judge) || '')
let language = $ref(Number.parseInt(route.query.language) || '')
let page = $ref(Number.parseInt(route.query.page) || 1)
let pageSize = $ref(Number.parseInt(route.query.pageSize) || 30)

const judgeList = $ref(constant.judgeList)
const languageList = $ref(constant.languageList)
const result = $ref(constant.result)
const lang = $ref(constant.language)
const color = $ref(constant.color)
const query = $computed(() => purify({ uid, pid, judge, language, page, pageSize }))

let loading = $ref(false)

async function fetch() {
  loading = true
  uid = route.query.uid || ''
  pid = route.query.pid || ''
  judge = Number.parseInt(route.query.judge) || ''
  language = Number.parseInt(route.query.language) || ''
  page = Number.parseInt(route.query.page) || 1
  pageSize = Number.parseInt(route.query.pageSize) || 30
  await find(query)
  loading = false
}

function reload(payload = {}) {
  router.push({
    name: 'status',
    query: purify(Object.assign({}, query, payload)),
  })
}

function search() {
  return reload({
    page: 1,
    uid,
    pid,
    language,
    judge,
  })
}

const pageChange = val => reload({ page: val })

fetch()
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="status-wrap">
    <div class="status-header">
      <Page class="status-page-table" :model-value="page" :total="sum" :page-size="pageSize" @on-change="pageChange" />
      <Page class="status-page-simple" simple :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange" />
      <div class="status-filter">
        <Input type="text" v-model="uid" placeholder="Username" class="status-filter-input" clearable />
        <Input type="number" v-model="pid" placeholder="PID" class="status-filter-input" clearable />
        <Select v-model="judge" placeholder="Judge" class="status-filter-input" clearable>
          <Option v-for="item in judgeList" :key="item.value" :label="item.label" :value="item.value" />
        </Select>
        <Select v-model="language" placeholder="Language" class="status-filter-input" clearable>
          <Option v-for="item in languageList" :key="item.value" :label="item.label" :value="item.value" />
        </Select>
        <Button type="primary" @click="search">{{ t('oj.search') }}</Button>
      </div>
    </div>
    <div class="status-table-container">
      <table class="status-table">
        <thead>
          <tr>
            <th class="status-sid">SID</th>
            <th class="status-pid">PID</th>
            <th class="status-username">Username</th>
            <th class="status-judge">Judge</th>
            <th class="status-time">
              <Badge>Time<template #count><span class="status-badge">(ms)</span></template></Badge>
            </th>
            <th class="status-memory">
              <Badge>Memory<template #count><span class="status-badge">(KB)</span></template></Badge>
            </th>
            <th class="status-language">Language</th>
            <th class="status-submit-time">Submit Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="list.length == 0" class="status-empty">
            <td colspan="8">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="item in list" :key="item.sid">
            <td class="status-sid" v-if="isAdmin || (profile && profile.uid === item.uid)">
              <router-link :to="{ name: 'solution', params: { sid: item.sid } }">
                {{ item.sid }}
              </router-link>
            </td>
            <td class="status-sid" v-else>{{ item.sid }}</td>
            <td class="status-pid">
              <router-link :to="{ name: 'problemInfo', params: { pid: item.pid } }">
                {{ item.pid }}
              </router-link>
            </td>
            <td class="status-username">
              <router-link :to="{ name: 'userInfo', params: { uid: item.uid } }">
                {{ item.uid }}
              </router-link>
            </td>
            <td class="status-judge">
              <span :class="color[item.judge]">{{ result[item.judge] }}</span>
              <Poptip trigger="hover" v-if="item.sim" placement="right">
                <Tag color="gold" class="status-sim-tag">
                  {{ item.sim }}%
                </Tag>
                <template #content>
                  <b>Sim SID:</b> {{ item.sim_s_id }}
                </template>
              </Poptip>
            </td>
            <td class="status-time">{{ item.time }}</td>
            <td class="status-memory">{{ item.memory }}</td>
            <td class="status-language">{{ lang[item.language] }}</td>
            <td class="status-submit-time">{{ timePretty(item.create) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="status-footer">
      <Page class="status-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator show-total
        @on-change="pageChange" />
      <Page class="status-page-mobile" size="small" :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        show-total @on-change="pageChange" />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../styles/common'

.status-wrap
  width 100%
  margin 0 auto
  padding 40px 0

.status-header
  padding 0 40px
  margin-bottom 25px
  display flex
  justify-content space-between
  align-items center
.status-page
  flex none
.status-filter
  display flex
  align-items center
  > *
    margin-left 4px
  .status-filter-input
    width 120px

.status-page-mobile, .status-page-simple
  display none

@media screen and (max-width: 1280px)
  .status-header
    .status-page-table
      display none
    .status-page-simple
      display block

@media screen and (max-width: 1024px)
  .status-wrap
    padding 20px 0
  .status-footer
    padding 0 20px
    margin-top 20px !important
  .status-header
    padding 0 20px
    margin-bottom 5px
    display block
    .status-page-simple
      display none
    .status-filter-input
      width 100% !important
      min-width 60px

@media screen and (max-width: 768px)
  .status-page-table
    display none
  .status-page-mobile
    display block

.status-table-container
  overflow-x auto
  width 100%
.status-table
  width 100%
  min-width 1024px
  table-layout fixed
  th, td
    padding 0 16px
  tbody tr
    transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7

.status-sid
  width 110px
  text-align right
.status-pid
  width 80px
  text-align right
.status-username
  width 170px
  max-width 170px
  text-align center
  white-space nowrap
  text-overflow ellipsis
  overflow hidden
.status-time, .status-memory
  width 100px
  text-align right
.status-language
  width 110px
  text-align center
.status-submit-time
  width 190px
.status-sim-tag
  margin 0px 0px 4px 8px
.status-badge
  position absolute
  font-size 8px
  top 10px
  right 8px

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

.status-footer
  padding 0 40px
  margin-top 40px
  text-align center
</style>
