<script setup>
import only from 'only'
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onRouteQueryUpdate, purify } from '@/util/helper'
import { useSessionStore } from '@/store/modules/session'
import { useNewsStore } from '@/store/modules/news'
import { timePretty } from '@/util/formate'

const newsStore = useNewsStore()
const sessionStore = useSessionStore()
const route = useRoute()
const router = useRouter()
const $Modal = inject('$Modal')
const $Message = inject('$Message')

const { find, 'delete': removeNews } = newsStore
const { isAdmin, canRemove } = $(storeToRefs(sessionStore))
const { list, sum } = $(storeToRefs(newsStore))
const page = $computed(() => parseInt(route.query.page) || 1)
const pageSize = $computed(() => parseInt(route.query.pageSize) || 5)
const query = $computed(() => {
  const opt = only(route.query, 'page pageSize')
  return purify(opt)
})

function fetch () {
  find(query)
}

const reload = (payload = {}) => {
  router.push({
    name: 'home',
    query: Object.assign(query, purify(payload)),
  })
}

const pageChange = val => reload({ page: val })
const del = nid => $Modal.confirm({
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

fetch()
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="home-wrap">
    <div class="news">
      NewsList
    </div>
    <Card v-for="item in list" :key="item.nid">
      <Row type="flex" align="middle">
        <Col :span="2">
          <Icon type="md-chatbubbles" />
        </Col>
        <Col :span="20">
          <router-link :to="{ name: 'newsInfo', params: { nid: item.nid } }">
            <span>{{ item.title }}</span>
          </router-link>
          <p>{{ timePretty(item.create) }}</p>
        </Col>
        <Col :span="2">
          <Icon v-if="isAdmin && canRemove" type="close-circled" @click="del(item.nid)" />
        </Col>
      </Row>
    </Card>
    <Page :model-value="page" :total="sum" :page-size="pageSize" show-elevator @on-change="pageChange" />
  </div>
</template>

<style lang="stylus">
.home-wrap
  margin: 0 10%
  .news
    font-size: 40px
    padding-bottom: 10px
  .content
    padding-left: 20px
    padding-bottom: 20px
    margin-bottom: 20px
    border-bottom: 1px solid #dfd8d8
  .ivu-card
    margin-bottom: 20px
    .ivu-icon-md-chatbubbles
      font-size: 24px
      margin-left: 30%
      // color: alpha($primary-color, 0.9)
      color: var(--oj-primary-color)
    p
      margin-top: 10px
    .ivu-icon-close-circled
      line-height: 20px
      color: #c3c2c2
      cursor: pointer
      &:hover
        font-size: 20px
</style>
