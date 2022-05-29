<template>
  <div>
    <Row class="filter">
      <Col :offset="1" :span="5">
        <Col :span="6"><label>User</label></Col>
        <Col :span="15"><Input v-model="uid" placeholder="username"></Input></Col>
      </Col>
      <Col :span="4">
        <Col :span="6"><label>Pid</label></Col>
        <Col :span="15"><Input v-model="pid" placeholder="pid"></Input></Col>
      </Col>
      <Col :span="6">
        <Col :span="6"><label>Judge</label></Col>
        <Col :span="16">
          <Select v-model="judge" placeholder="请选择">
            <Option
              v-for="item in judgeList"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </Option>
          </Select>
        </Col>
      </Col>
      <Col :span="4">
        <Col :span="12"><label>Language</label></Col>
        <Col :span="12">
          <Select v-model="language" placeholder="请选择">
            <Option
              v-for="item in languageList"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </Option>
          </Select>
        </Col>
      </Col>
      <Col :span="3">
        <Button type="primary" @click="search" icon="search">Search</Button>
      </Col>
    </Row>
    <Row class="pagination" type="flex" justify="start">
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
          <router-link :to="{ name: 'contestProblem', params: { cid: mid, id: getId(item.pid) } }">
            {{ getId(item.pid) }}
          </router-link>
        </td>
        <td>
          <Button type="text">{{ item.uid }}</Button>
        </td>
        <td :class="color[item.judge]">
          {{ result[item.judge] }}
          <Tag color="yellow" v-if="item.sim">[{{ item.sim }}%]{{ item.sim_s_id }}</Tag>
        </td>
        <td>{{ item.time }}</td>
        <td>{{ item.memory }}</td>
        <td v-if="isAdmin || (profile && profile.uid === item.uid)">
          <router-link :to="{ name: 'solution', params: { sid: item.sid } }">
            {{ lang[item.language] }}
          </router-link>
        </td>
        <td v-else>{{ lang[item.language] }}</td>
        <td>{{ item.create | timePretty }}</td>
      </tr>
    </table>
  </div>
</template>
<script>
import only from 'only'
import constant from '@/util/constant'
import { purify } from '@/util/helper'
import { useSessionStore } from '@/store/modules/session'
import { mapState, mapActions } from 'pinia'
import { useSolutionStore } from '@/store/modules/solution'
import { useContestStore } from '@/store/modules/contest'
import { useRootStore } from '@/store'

export default {
  data () {
    return {
      mid: this.$route.params.cid,
      uid: this.$route.query.uid || '',
      pid: this.$route.query.pid || '',
      judge: this.$route.query.judge || '',
      language: this.$route.query.language || '',
      page: parseInt(this.$route.query.page) || 1,
      pageSize: parseInt(this.$route.query.pageSize) || 30,
      judgeList: constant.judgeList,
      languageList: constant.languageList,
      result: constant.result,
      lang: constant.language,
      color: constant.color
    }
  },
  created () {
    // 这里必须保证此时'contest/problems'是存在的
    // 如果用户没有点过 overview tab 时，就会出现 'contest/problems' 不存在的情况
    let p = Promise.resolve()
    if (typeof this.problems === 'undefined') {
      p = this.findOne({ cid: this.$route.params.cid })
    }
    p.then(() => {
      this.fetch()
      this.changeDomTitle({ title: `Contest ${this.$route.params.cid}` })
    })
  },
  computed: {
    ...mapState(useContestStore, ['problems']),
    ...mapState(useSessionStore, ['profile', 'isAdmin']),
    ...mapState(useSolutionStore, ['list', 'sum']),
    query () {
      const opt = Object.assign(
        {},
        only(this.$route.query, 'page pageSize uid pid language judge'),
        {
          mid: this.$route.params.cid
        }
      )
      if (this.$route.query.pid) {
        opt.pid = this.problems[this.$route.query.pid - 1]
      }
      return purify(opt)
    }
  },
  methods: {
    ...mapActions(useContestStore, ['findOne']),
    ...mapActions(useRootStore, ['changeDomTitle']),
    ...mapActions(useSolutionStore, {findSolutions: 'find'}),
    getId (pid) {
      return this.problems.indexOf(pid) + 1
    },
    fetch () {
      this.findSolutions(this.query)
      const query = this.$route.query
      this.page = parseInt(query.page) || 1
      this.pageSize = parseInt(query.pageSize) || 30
      this.uid = query.uid
      this.pid = query.pid || ''
      this.judge = query.judge || ''
      this.language = query.language || ''
    },
    reload (payload = {}) {
      this.$router.push({
        name: 'contestStatus',
        query: purify(Object.assign({}, this.query, payload))
      })
    },
    search (val) {
      this.reload({
        page: 1,
        uid: this.uid,
        pid: this.pid,
        language: this.language,
        judge: this.judge
      })
    },
    sizeChange (val) {
      this.reload({ pageSize: val })
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
    }
  }
}
</script>
<style lang="stylus" scoped>
@import '../../styles/common'

.filter
  margin-bottom: 20px
  label
    height: 32px
    line-height: 32px
  .ivu-col
    text-align: center
    margin-bottom: 0
    font-size: 14px
  .ivu-select-item
    text-align: left
.pagination
  margin-left: 10px
  .ivu-col
    text-align: left
    margin-bottom: 10px
</style>
