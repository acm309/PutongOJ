<script setup>
import pangu from 'pangu'
import { storeToRefs } from 'pinia'
import { Button, Option, Page, Select, Text } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useRootStore } from '@/store'
import { useGroupStore } from '@/store/modules/group'
import { useRanklistStore } from '@/store/modules/ranklist'

import { formate } from '@/utils/formate'

import { onRouteQueryUpdate, purify } from '@/utils/helper'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const group = $ref(Number.parseInt(route.query.gid) || '')
const page = $computed(() => Number.parseInt(route.query.page) || 1)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 30)

const query = $computed(() => purify({
  page,
  pageSize,
  gid: group,
}))

const rootStore = useRootStore()
const ranklistStore = useRanklistStore()
const groupStore = useGroupStore()

const { list: groups } = $(storeToRefs(groupStore))
const { judge } = $(storeToRefs(rootStore))
const { list, sum } = $(storeToRefs(ranklistStore))

let loading = $ref(false)

function reload (payload = {}) {
  const routeQuery = Object.assign({}, query, payload)
  router.push({ name: 'ranklist', query: routeQuery })
}

async function fetch () {
  loading = true
  await Promise.all([
    ranklistStore.find(query),
    groupStore.find({ lean: 1 }),
  ])
  loading = false
}

const pageChange = val => reload({ page: val })
const search = () => reload({ gid: group, page: 1 })

fetch()
onBeforeRouteLeave(() => groupStore.clearSavedGroups())
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="ranklist-wrap">
    <div class="ranklist-header">
      <Page
        class="ranklist-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange"
      />
      <Page
        class="ranklist-page-simple" simple :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange"
      />
      <div class="ranklist-filter">
        <Select v-model="group" class="ranklist-filter-select" filterable clearable :placeholder="t('oj.group')">
          <Option v-for="item in groups" :key="item.gid" :value="item.gid">
            {{ item.title }}
          </Option>
        </Select>
        <Button type="primary" class="ranklist-filter-button" @click="search">
          {{ t('oj.search') }}
        </Button>
      </div>
    </div>
    <div class="ranklist-table-container">
      <table class="ranklist-table">
        <thead>
          <tr>
            <th class="ranklist-rank">
              Rank
            </th>
            <th class="ranklist-username">
              {{ t('oj.username') }}
            </th>
            <th class="ranklist-nick">
              {{ t('oj.nick') }}
            </th>
            <th class="ranklist-motto">
              {{ t('oj.motto') }}
            </th>
            <th class="ranklist-solved">
              {{ t('oj.solved') }}
            </th>
            <th class="ranklist-submit">
              {{ t('oj.submit') }}
            </th>
            <th class="ranklist-ratio">
              Ratio
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="list.length === 0" class="status-empty">
            <td colspan="7">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="(item, index) in list" :key="item.uid">
            <td class="ranklist-rank">
              {{ index + 1 + (page - 1) * pageSize }}
            </td>
            <td class="ranklist-username">
              <router-link :to="{ name: 'UserProfile', params: { uid: item.uid } }">
                {{ item.uid }}
              </router-link>
            </td>
            <td class="ranklist-nick">
              {{ item.nick }}
            </td>
            <td class="ranklist-motto">
              <Text class="ranklist-motto-text" :ellipsis="true" :ellipsis-config="{ tooltip: true }">
                {{ pangu.spacing(item.motto || '').trim() }}
              </Text>
            </td>
            <td class="ranklist-solved">
              <router-link :to="{ name: 'status', query: { uid: item.uid, judge: judge.Accepted } }">
                {{ item.solve }}
              </router-link>
            </td>
            <td class="ranklist-submit">
              <router-link :to="{ name: 'status', query: { uid: item.uid } }">
                {{ item.submit }}
              </router-link>
            </td>
            <td class="ranklist-ratio">
              <span>{{ formate(item.solve / (item.submit + 0.0000001)) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="ranklist-footer">
      <Page
        class="ranklist-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator show-total
        @on-change="pageChange"
      />
      <Page
        class="ranklist-page-mobile" size="small" :model-value="page" :total="sum" :page-size="pageSize"
        show-elevator show-total @on-change="pageChange"
      />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../styles/common'

.ranklist-wrap
  width 100%
  margin 0 auto
  padding 40px 0

.ranklist-header
  padding 0 40px
  margin-bottom 25px
  display flex
  justify-content space-between
  align-items center
.ranklist-page-simple, .ranklist-page-mobile
  display none
.ranklist-filter
  display flex
  align-items center
  > *
    margin-left 4px
  .ranklist-filter-select
    width 160px

@media screen and (max-width: 1024px)
  .ranklist-wrap
    padding 20px 0
  .ranklist-header
    padding 0 20px
    margin-bottom 5px
    .ranklist-page-table
      display none
    .ranklist-page-simple
      display block
  .ranklist-footer
    padding 0 20px
    margin-top 20px !important

@media screen and (max-width: 768px)
  .ranklist-page-table, .ranklist-page-simple
    display none !important
  .ranklist-page-mobile
    display block
  .ranklist-filter
    width 100%
    .ranklist-filter-select
      width 100%

.ranklist-table-container
  overflow-x auto
  width 100%
.ranklist-table
  width 100%
  min-width 1024px
  table-layout fixed
  th, td
    padding 0 16px
  tbody tr
    transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7

.ranklist-rank
  width 90px
  text-align right
.ranklist-username
  width 170px
  max-width 170px
  text-align center
  white-space nowrap
  text-overflow ellipsis
  overflow hidden
.ranklist-nick
  width 200px
  max-width 200px
  white-space nowrap
  text-overflow ellipsis
  overflow hidden
.ranklist-motto-text
  width 100%
.ranklist-solved
  width 100px
  text-align center
.ranklist-submit
  width 80px
  text-align center
.ranklist-ratio
  width 120px
  text-align right
  padding-right 40px !important
th.ranklist-ratio
  text-align center

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

.ranklist-footer
  padding 0 40px
  margin-top 40px
  text-align center
</style>
