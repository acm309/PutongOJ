<template lang="html">
  <div class="home-wrap">
    <div class="news">NewsList</div>
    <Card v-for="(item, index) in list">
      <Row type="flex" align="middle">
        <Col :span="2">
          <Icon type="chatbox-working"></Icon>
        </Col>
        <Col :span="16">
          <router-link :to="{ name: 'newsInfo', params: { nid: item.nid } }">
            <span>{{ item.title }}</span>
          </router-link>
          <p>{{ item.create | timePretty }}</p>
        </Col>
      </Row>
    </Card>
    <Page :total="sum" @on-change="pageChange" :page-size="pageSize" :current.sync="page" show-elevator></Page>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { purify } from '@/util/helper'
import only from 'only'

export default {
  data () {
    return {
      currentPage: 1,
      pageSize: 5
    }
  },
  computed: {
    ...mapGetters('news', [
      'list',
      'sum'
    ]),
    query () {
      const opt = only(this.$route.query, 'page pageSize')
      return purify(opt)
    }
  },
  created () {
    this.fetch()
  },
  methods: {
    fetch () {
      this.$store.dispatch('news/find', this.query).then(console.log(this.sum))
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
.home-wrap
  margin: 0 10%
  .news
    font-size: 40px
    padding-bottom: 10px
    margin-bottom: 20px
    border-bottom: 1px solid #dfd8d8
  .ivu-card
    margin-bottom: 20px
    .ivu-icon-chatbox-working
      font-size: 24px
      margin-left: 30%
      color: rgba(201, 31, 242, 0.5)
    p
      margin-top: 10px
</style>
