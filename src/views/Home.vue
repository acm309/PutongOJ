<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { onRouteQueryUpdate, purify } from '@/util/helper'
import { useNewsStore } from '@/store/modules/news'
import { timePretty } from '@/util/formate'

import pangu from 'pangu'

import { Card, Row, Col, Icon, Page, Spin } from 'view-ui-plus'

const { t } = useI18n()
const newsStore = useNewsStore()
const route = useRoute()
const router = useRouter()
const { find } = newsStore
const { list, sum } = $(storeToRefs(newsStore))

const page = $computed(() => Number.parseInt(route.query.page) || 1)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 5)
const query = $computed(() => {
  return purify({
    page: page,
    pageSize: pageSize,
  })
})

let loading = $ref(false)

async function fetch() {
  loading = true
  await find(query)
  loading = false
}

function reload(payload = {}) {
  router.push({
    name: 'home',
    query: Object.assign(query, purify(payload)),
  })
}

const pageChange = val => reload({ page: val })

fetch()
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="home-wrap">
    <div class="news-header">
      <span class="welcome-text">Welcome to Putong OJ</span><br />
      {{ t('oj.news_list') }}
    </div>
    <router-link v-if="list.length > 0" v-for="item in list" :key="item.nid"
      :to="{ name: 'newsInfo', params: { nid: item.nid } }" class="news-link">
      <Card dis-hover class="news-card">
        <Row type="flex" :gutter="16">
          <Col flex="68px" class="news-icon">
          <Icon type="md-paper" class="icon-paper" />
          </Col>
          <Col flex="auto" class="news-content">
          <span class="news-title">{{ pangu.spacing(item.title) }}</span>
          <p class="news-date">{{ timePretty(item.create, 'yyyy-MM-dd HH:mm') }}</p>
          </Col>
        </Row>
      </Card>
    </router-link>
    <div v-else class="news-empty">
      <Icon type="ios-planet-outline" class="empty-icon" />
      <span class="empty-text">{{ t('oj.empty_content') }}</span>
    </div>
    <div class="pagination-table">
      <Page :model-value="page" :total="sum" :page-size="pageSize" show-elevator @on-change="pageChange" />
    </div>
    <div class="pagination-mobile">
      <Page size="small" :model-value="page" :total="sum" :page-size="pageSize" show-elevator @on-change="pageChange" />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
.home-wrap
  width 100%
  max-width 1024px
  margin 0 auto
  padding-top 20px !important

  .news-header
    font-size 28px
    padding-bottom 16px
    .welcome-text
      font-size 12px

  .news-link
    text-decoration none
    color inherit
  .news-card
    margin-bottom 20px
    transition border-color 0.2s ease

    &:hover
      border-color var(--oj-primary-color) !important
      .news-date
        color var(--oj-primary-color)

  .news-icon
    display flex
    align-items center
    justify-content center
    .icon-paper
      font-size 32px
      color var(--oj-primary-color)
      opacity 0.85

  .news-content
    .news-title
      color var(--oj-primary-color)
      font-size 16px
    .news-date
      margin-top 7px
      transition color 0.2s ease

  .pagination-table
    display block
  .pagination-mobile
    display none
    text-align center

.news-empty
  margin-bottom 20px
  padding 32px
  border 1px solid #dcdee2
  border-radius 4px
  display flex
  align-items center
  justify-content center
  .empty-icon
    font-size 32px
  .empty-text
    margin-left 32px

@media screen and (max-width: 1024px)
  .home-wrap
    padding-top 10px !important

@media screen and (max-width: 768px)
  .pagination-table
    display none !important
  .pagination-mobile
    display block !important
  .news-icon
    display none !important
</style>
