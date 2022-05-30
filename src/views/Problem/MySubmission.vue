<template>
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
      <tr v-for="item in list" :key="item.sid">
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
        <td>{{ timePretty(item.create) }}</td>
      </tr>
    </table>
  </div>
</template>
<script>
import { mapState, mapActions } from 'pinia'
import only from 'only'
import constant from '@/util/constant'
import { purify } from '@/util/helper'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { useSolutionStore } from '@/store/modules/solution'
import { timePretty } from '@/util/formate'

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
    this.changeDomTitle({ title: `Problem ${this.$route.params.pid}` })
  },
  computed: {
    ...mapState(useSolutionStore, ['list', 'sum']),
    ...mapState(useSessionStore, ['profile', 'isAdmin']),
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
    timePretty,
    ...mapActions(useRootStore, ['changeDomTitle']),
    ...mapActions(useSolutionStore, ['find']),
    fetch () {
      this.find(this.query)
      const query = this.$route.query
      this.page = parseInt(query.page) || 1
      this.pageSize = parseInt(query.pageSize) || 30
    },
    reload (payload = {}) {
      this.$router.push({
        name: 'mySubmission',
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
@import '../../styles/common'

.pagination
  margin-top: 10px
  margin-bottom: 10px
table
  th:nth-child(1)
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
</style>
