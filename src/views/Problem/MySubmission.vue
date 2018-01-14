<template lang="html">
  <div class="status-wrap">
    <Row class="pagination">
      <Col :span="16">
        <Page :total="sum" @on-change="pageChange" :page-size="pageSize" :current.sync="page" show-elevator></Page>
      </Col>
    </Row>
    <table>
      <tr>
        <th>SID</th>
        <th>PID</th>
        <th>Username</th>
        <th>Judge</th>
        <th>Time/ms</th>
        <th>Memory/kb</th>
        <th>Language</th>
        <th>Submit Time</th>
      </tr>
      <tr v-for="(item, index) in list">
        <td>{{ item.sid }}</td>
        <td>
          <router-link :to="{ name: 'problemInfo', params: { pid: item.pid } }">
            {{ item.pid }}
          </router-link>
        </td>
        <td>
          <router-link :to="{ name: 'userInfo', params: { uid: item.uid } }">
            <Button type="text">{{ item.uid }}</Button>
          </router-link>
        </td>
        <td :class="color[item.judge]">{{ result[item.judge] }}</td>
        <td>{{ item.time }}</td>
        <td>{{ item.memory }}</td>
        <td>
          <router-link :to="{ name: 'solution', params: { sid: item.sid } }">
            {{ lang[item.language] }}
          </router-link>
        </td>
        <td>{{ item.create | timePretty }}</td>
      </tr>
    </table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import only from 'only'
import constant from '@/util/constant'
import { purify } from '@/util/helper'

export default {
  data () {
    return {
      page: parseInt(this.$route.query.page) || 1,
      pageSize: parseInt(this.$route.query.pageSize) || 30,
      result: constant.result,
      lang: constant.language,
      color: constant.color
    }
  },
  created () {
    this.fetch()
  },
  computed: {
    ...mapGetters({
      list: 'solution/list',
      sum: 'solution/sum',
      profile: 'session/profile',
      isAdmin: 'session/isAdmin'
    }),
    query () {
      const opt = Object.assign(
        only(this.$route.query, 'page pageSize language judge'),
        {
          pid: this.$route.params.pid,
          uid: 'err' // err表示没有用户登录时的uid，前端限制过用户名不能少于5位
        }
      )
      if (this.profile && this.profile.uid) {
        opt.uid = this.profile.uid
      }
      return purify(opt)
    }
  },
  methods: {
    fetch () {
      this.$store.dispatch('solution/find', this.query)
      const query = this.$route.query
      this.page = parseInt(query.page) || 1
      this.pageSize = parseInt(query.pageSize) || 30
    },
    reload (payload = {}) {
      this.$router.push({
        name: 'Mysubmission',
        query: purify(Object.assign(this.query, payload))
      })
    },
    pageChange (val) {
      this.reload({ page: val })
    }
  },
  watch: {
    '$route' (to, from) {
      if (to !== from) {
        this.fetch()
      }
    },
    'profile' (val) {
      this.fetch()
    }
  }
}
</script>

<style lang="stylus" scoped>
.pagination
  margin-top: 10px
  margin-bottom: 10px
table
  width: 100%
  border-collapse: collapse
  border-spacing: 0
  th:nth-child(1)
    padding-left: 10px
    width: 8%
  th:nth-child(2)
    width: 8%
  th:nth-child(3)
    width: 10%
  th:nth-child(4)
    width: 15%
  th:nth-child(5)
    width: 8%
  th:nth-child(6)
    width: 8%
  th:nth-child(7)
    width: 8%
  th:nth-child(8)
    width: 15%
  tr
    border-bottom: 1px solid #ebeef5
    height: 40px
    line-height: 40px
    font-size: 14px
    td:nth-child(1)
      padding-left: 10px
  th
    text-align:left
  .ivu-btn
    vertical-align: baseline
    color: #e040fb
    padding: 0 1px
    font-size: 14px
</style>
