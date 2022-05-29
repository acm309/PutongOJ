<template>
  <div class="home-wrap">
    <div class="news">NewsList</div>
    <Card v-for="item in list" :key="item.nid">
      <Row type="flex" align="middle">
        <Col :span="2">
          <Icon type="chatbox-working"></Icon>
        </Col>
        <Col :span="20">
          <router-link :to="{ name: 'newsInfo', params: { nid: item.nid } }">
            <span>{{ item.title }}</span>
          </router-link>
          <p>{{ item.create | timePretty }}</p>
        </Col>
        <Col :span="2">
          <Icon v-if="isAdmin && canRemove" type="close-circled" @click.native="del(item.nid)"></Icon>
        </Col>
      </Row>
    </Card>
    <Page :total="sum" @on-change="pageChange" :page-size="pageSize" :current.sync="page" show-elevator></Page>
  </div>
</template>
<script>
import { purify } from '@/util/helper'
import only from 'only'
import { useSessionStore } from '@/store/modules/session'
import { useNewsStore } from '@/store/modules/news'
import { mapActions, mapState } from 'pinia'

export default {
  data () {
    return {
      currentPage: 1,
      pageSize: 5
    }
  },
  computed: {
    ...mapState(useNewsStore, ['list', 'sum']),
    ...mapState(useSessionStore, ['isAdmin', 'canRemove']),
    query () {
      const opt = only(this.$route.query, 'page pageSize')
      return purify(opt)
    }
  },
  created () {
    this.fetch()
  },
  methods: {
    ...mapActions(useNewsStore, ['find']),
    ...mapActions(useNewsStore, {
      removeNews: 'delete'
    }),
    fetch () {
      this.find(this.query)
      const query = this.$route.query
      this.page = parseInt(query.page) || 1
      if (query.pageSize) this.pageSize = parseInt(query.pageSize)
    },
    reload (payload = {}) {
      const query = Object.assign(this.query, purify(payload))
      this.$router.push({
        name: 'home',
        query
      })
    },
    pageChange (val) {
      this.reload({ page: val })
    },
    del (nid) {
      this.$Modal.confirm({
        title: '提示',
        content: '<p>此操作将永久删除该消息, 是否继续?</p>',
        onOk: () => {
          this.removeNews({ nid }).then(() => {
            this.$Message.success(`成功删除 ${nid}！`)
            this.$router.push({
              name: 'home',
              query: { page: this.page }
            })
          })
        },
        onCancel: () => {
          this.$Message.info('已取消删除！')
        }
      })
    }
  },
  watch: { // 浏览器后退时回退页面
    '$route' (to, from) {
      if (to !== from) this.fetch()
    }
  }
}
</script>
<style lang="stylus">
@import '../styles/common'

.home-wrap
  margin: 0 10%
  .news
    font-size: 40px
    padding-bottom: 10px
    // margin-bottom: 20px
    // border-bottom: 1px solid #dfd8d8
  .content
    padding-left: 20px
    padding-bottom: 20px
    margin-bottom: 20px
    border-bottom: 1px solid #dfd8d8
  .ivu-card
    margin-bottom: 20px
    .ivu-icon-chatbox-working
      font-size: 24px
      margin-left: 30%
      color: alpha($primary-color, 0.9)
    p
      margin-top: 10px
    .ivu-icon-close-circled
      line-height: 20px
      color: #c3c2c2
      cursor: pointer
      &:hover
        font-size: 20px
</style>
