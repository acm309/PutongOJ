<script setup>
import only from 'only'
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { onRouteQueryUpdate, purify } from '@/util/helper'
import { useSessionStore } from '@/store/modules/session'
import { useNewsStore } from '@/store/modules/news'
import { timePretty } from '@/util/formate'

const { t } = useI18n()
const newsStore = useNewsStore()
const sessionStore = useSessionStore()
const route = useRoute()
const router = useRouter()
const $Modal = inject('$Modal')
const $Message = inject('$Message')

const { find, 'delete': removeNews } = newsStore
const { isAdmin, canRemove } = $(storeToRefs(sessionStore))
const { list, sum } = $(storeToRefs(newsStore))
const page = $computed(() => Number.parseInt(route.query.page) || 1)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 5)
const query = $computed(() => {
  const opt = only(route.query, 'page pageSize')
  return purify(opt)
})

function fetch() {
  find(query)
}

function reload(payload = {}) {
  router.push({
    name: 'home',
    query: Object.assign(query, purify(payload)),
  })
}

const pageChange = val => reload({ page: val })
function del(nid) {
  return $Modal.confirm({
    title: '提示',
    content: '<p>此操作将永久删除该消息, 是否继续?</p>',
    onOk: async () => {
      await removeNews({ nid })
      $Message.success(`成功删除 ${nid}！`)
      reload({ page: currentPage })
    },
    onCancel: () => {
      $Message.info('已取消删除！')
    },
  })
}

fetch()
onRouteQueryUpdate(fetch)
// Another way to use $Modal
// console.log(getCurrentInstance().$Message)
// console.log(getCurrentInstance().appContext.config.globalProperties.$Modal.confirm())
</script>

<template>
  <div class="home-wrap">
    <div class="news">
      <span>Welcome to Putong OJ</span><br />
      {{ t('oj.news_list') }}
    </div>
    <router-link v-for="item in list" :key="item.nid" :to="{ name: 'newsInfo', params: { nid: item.nid } }"
      style="text-decoration: none; color: inherit;">
      <Card dis-hover>
        <Row type="flex" :gutter="16">
          <Col flex="68px" class="news-icon">
          <Icon type="md-paper" />
          </Col>
          <Col flex="auto">
          <span>{{ item.title }}</span>
          <p>{{ timePretty(item.create) }}</p>
          </Col>
          <Col flex="68px" class="close-icon" v-if="isAdmin && canRemove">
          <Icon type="md-close-circle" @click.stop="del(item.nid)" />
          </Col>
        </Row>
      </Card>
    </router-link>
    <Page class="page-table" :model-value="page" :total="sum" :page-size="pageSize" show-elevator
      @on-change="pageChange" />
    <Page class="page-mobile" size="small" :model-value="page" :total="sum" :page-size="pageSize" show-elevator
      @on-change="pageChange" />
  </div>
</template>

<style lang="stylus">
.home-wrap
  width 100%
  max-width 1024px
  .news
    font-size: 28px
    padding-bottom: 16px
    span
      font-size 12px
  .news-icon, .close-icon
    display: flex
    align-items: center
    justify-content: center
  .ivu-card
    margin-bottom: 20px
    .ivu-icon-md-paper
      font-size: 32px
      color: var(--oj-primary-color)
      opacity: 0.85
    span
      color var(--oj-primary-color)
      font-size 16px
    p
      margin-top: 7px
    .ivu-icon-md-close-circle
      opacity: 0.85
      font-size: 1.5rem
      // color: #c3c2c2
      cursor: pointer
@media screen and (max-width: 768px)
  .page-table
    display: none
  .news-icon
    display: none !important
@media screen and (min-width: 769px)
  .page-mobile
    display: none
</style>
