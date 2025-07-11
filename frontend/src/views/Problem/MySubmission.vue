<script setup>
import { storeToRefs } from 'pinia'
import { Badge, Icon, Page } from 'view-ui-plus'
import { inject, onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'

import { useRoute, useRouter } from 'vue-router'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { useSolutionStore } from '@/store/modules/solution'
import { color, language, result } from '@/util/constant'
import { timePretty } from '@/util/formate'

import { onProfileUpdate, onRouteQueryUpdate, purify } from '@/util/helper'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = inject('$Message')

const rootStore = useRootStore()
const sessionStore = useSessionStore()
const solutionStore = useSolutionStore()

const { changeDomTitle } = rootStore
const { find } = solutionStore
const { isLogined, profile } = $(storeToRefs(sessionStore))
const { list, sum } = $(storeToRefs(solutionStore))

let loading = $ref(false)
let refreshing = $ref(false)

const page = $computed(() => Number.parseInt(route.query.page) || 1)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 20)
const query = $computed(() => purify({ pid: route.params.pid, uid: profile.uid, page, pageSize }))

function reload (payload = {}) {
  return router.push({
    name: 'mySubmission',
    query: purify(Object.assign({ page, pageSize }, payload)),
  })
}

const pageChange = val => reload({ page: val })

async function refresh () {
  refreshing = loading = true
  await find(query)
  loading = false
  setTimeout(() => refreshing = false, 500)
}

function init () {
  loading = true
  changeDomTitle({ title: `Problem ${route.params.pid} - My Submission` })
  if (!isLogined) {
    message.error(t('oj.error_403'))
    return router.push({ name: 'problemInfo', params: { pid: route.params.pid } })
  }
  refresh()
}

onBeforeMount(init)
onProfileUpdate(init)
onRouteQueryUpdate(init)
</script>

<template>
  <div class="status-wrap">
    <div class="status-header">
      <Page
        class="status-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange"
      />
      <Page
        class="status-page-simple" simple :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange"
      />
      <div class="status-action">
        <Button type="primary" icon="md-refresh" :loading="refreshing" @click="refresh">
          {{ t('oj.refresh') }}
        </Button>
      </div>
    </div>
    <div class="status-table-container">
      <table class="status-table">
        <thead>
          <tr>
            <th class="status-sid">
              SID
            </th>
            <th class="status-judge">
              Judge
            </th>
            <th class="status-time">
              <Badge>
                Time<template #count>
                  <span class="status-badge">(ms)</span>
                </template>
              </Badge>
            </th>
            <th class="status-memory">
              <Badge>
                Memory<template #count>
                  <span class="status-badge">(KB)</span>
                </template>
              </Badge>
            </th>
            <th class="status-language">
              Language
            </th>
            <th class="status-submit-time">
              Submit Time
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="list.length === 0" class="status-empty">
            <td colspan="6">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="item in list" :key="item.sid">
            <td class="status-sid">
              <router-link :to="{ name: 'solution', params: { sid: item.sid } }">
                {{ item.sid }}
              </router-link>
            </td>
            <td class="status-judge">
              <span :class="color[item.judge]">{{ result[item.judge] }}</span>
            </td>
            <td class="status-time">
              {{ item.time }}
            </td>
            <td class="status-memory">
              {{ item.memory }}
            </td>
            <td class="status-language">
              {{ language[item.language] }}
            </td>
            <td class="status-submit-time">
              {{ timePretty(item.create) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="status-footer">
      <Page
        class="status-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator show-total
        @on-change="pageChange"
      />
      <Page
        class="status-page-mobile" size="small" :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        show-total @on-change="pageChange"
      />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'

.status-wrap
  width 100%
  margin 0 auto
  padding 40px 0 !important
  margin-top -40px

.status-header
  padding 0 40px
  margin-bottom 25px
  display flex
  justify-content space-between
  align-items center
.status-page
  flex none

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
    padding 20px 0 !important
    margin-top -20px
  .status-footer
    padding 0 20px
    margin-top 20px !important
  .status-header
    padding 0 20px
    margin-bottom 5px

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
  min-width 800px
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
.status-time, .status-memory
  width 100px
  text-align right
.status-language
  width 110px
  text-align center
.status-submit-time
  width 190px
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
