<script setup>
import { storeToRefs } from 'pinia'
import { Button, Option, Page, Select } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { timePretty } from '@/util/formate'
import { onRouteQueryUpdate, purify } from '@/util/helper'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const adminFilter = $ref(route.query.privilege || '')
const content = $ref(route.query.content || '')
const page = $computed(() => Number.parseInt(route.query.page) || 1)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 30)

const query = $computed(() => purify({ page, pageSize, privilege: adminFilter, content, type: 'uid' }))

const userStore = useUserStore()
const { list, sum } = $(storeToRefs(userStore))

let loading = $ref(false)

function reload (payload = {}) {
  const routeQuery = Object.assign({}, query, payload)
  router.push({ name: 'userManager', query: routeQuery })
}

async function fetch () {
  loading = true
  await userStore.find(query)
  loading = false
}

const pageChange = val => reload({ page: val })
const search = () => reload({ page: 1 })

fetch()
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="users-wrap">
    <div class="users-header">
      <Page
        class="users-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange"
      />
      <Page
        class="users-page-simple" simple :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        @on-change="pageChange"
      />
      <div class="users-filter">
        <Select v-model="adminFilter" class="filter-select" filterable clearable :placeholder="t('oj.privilege')">
          <Option :key="0" value="">
            All
          </Option>
          <Option :key="1" value="admin">
            {{ t('oj.admin') }}
          </Option>
        </Select>
        <Input
          v-model="content" class="search-input" clearable placeholder="Search by username"
          @keyup.enter="search"
        />
        <Button type="primary" class="filter-button" @click="search">
          {{ t('oj.search') }}
        </Button>
      </div>
    </div>
    <div class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th class="users-username">
              {{ t('oj.username') }}
            </th>
            <th class="users-nick">
              {{ t('oj.nick') }}
            </th>
            <th class="users-privilege">
              {{ t('oj.privilege') }}
            </th>
            <th class="users-create">
              Register Time
            </th>
            <th class="users-action">
              {{ t('oj.edit') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="list.length === 0" class="status-empty">
            <td colspan="5">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="item in list" :key="item.uid">
            <td class="users-username">
              <router-link :to="{ name: 'userProfile', params: { uid: item.uid } }">
                {{ item.uid }}
              </router-link>
            </td>
            <td class="users-nick">
              {{ item.nick }}
            </td>
            <td class="users-privilege">
              <Tag v-if="item.privilege === 0" class="privilege-tag" type="red">
                Banned
              </Tag>
              <Tag v-else-if="item.privilege === 1" class="privilege-tag" type="default">
                User
              </Tag>
              <Tag v-else-if="item.privilege === 2" class="privilege-tag" type="cyan">
                Admin
              </Tag>
              <Tag v-else-if="item.privilege === 3" class="privilege-tag" type="gold">
                Root
              </Tag>
            </td>
            <td class="users-create">
              {{ timePretty(item.createdAt) }}
            </td>
            <td class="users-action">
              <router-link :to="{ name: 'userEdit', params: { uid: item.uid } }">
                {{ t('oj.edit') }}
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="users-footer">
      <Page
        class="users-page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator show-total
        @on-change="pageChange"
      />
      <Page
        class="users-page-mobile" size="small" :model-value="page" :total="sum" :page-size="pageSize" show-elevator
        show-total @on-change="pageChange"
      />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'

.users-wrap
  width 100%
  max-width 1024px
  margin 0 auto
  padding 40px 0

.users-header
  padding 0 40px
  margin-bottom 25px
  display flex
  justify-content space-between
  align-items center
.users-page-simple, .users-page-mobile
  display none
.users-filter
  display flex
  align-items center
  > *
    margin-left 4px
  .filter-select
    width 100px
  .search-input
    width 160px

@media screen and (max-width: 1024px)
  .users-wrap
    padding 20px 0
  .users-header
    padding 0 20px
    margin-bottom 5px
    .users-page-table
      display none
    .users-page-simple
      display block
  .users-footer
    padding 0 20px
    margin-top 20px !important

@media screen and (max-width: 768px)
  .users-page-table, .users-page-simple
    display none !important
  .users-page-mobile
    display block
  .users-filter
    width 100%
    .filter-select, .search-input
      width 100%

.users-table-container
  overflow-x auto
  width 100%
.users-table
  width 100%
  min-width 800px
  table-layout fixed
  th, td
    padding 0 16px
  tbody tr
    transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7

.users-username
  padding-left 40px !important
  width 200px
  max-width 170px
  text-align left
  white-space nowrap
  text-overflow ellipsis
  overflow hidden
.users-nick
  white-space nowrap
  text-overflow ellipsis
  overflow hidden
.users-privilege
  width 140px
  text-align center
  .privilege-tag
    margin 0 0 4px
.users-create
  width 200px
  text-align center
.users-action
  width 100px
  text-align right
  padding-right 40px !important

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

.users-footer
  padding 0 40px
  margin-top 40px
  text-align center
</style>
