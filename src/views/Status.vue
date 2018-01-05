<template lang="html">
  <div class="status-wrap">
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
        <th>Time</th>
        <th>Memory</th>
        <th>Language</th>
        <th>Length</th>
        <th>Submit Time</th>
      </tr>
      <tr v-for="(item, index) in list">
        <td>{{ item.sid }}</td>
        <td>{{ item.pid }}</td>
        <td>
          <Button type="text">{{ item.uid }}</Button>
        </td>
        <td :class="color[item.judge]">{{ result[item.judge] }}</td>
        <td>{{ item.time }} MS</td>
        <td>{{ item.memory }}</td>
        <td>
          <router-link :to="{ name: 'solution', params: { sid: item.sid } }">
            <Button @click="" type="text">{{ lang[item.language] }}</Button>
          </router-link>
        </td>
        <td>{{ item.length }} B</td>
        <td>{{ item.create | timePretty }}</td>
      </tr>
    </table>
  </div>
</template>

<script>
// import Solution from '@/components/Solution'
import { mapGetters } from 'vuex'
import constant from '../util/constant'
import only from 'only'
import { purify } from '@/util/helper'

export default {
  data () {
    return {
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
    this.fetch()
  },
  computed: {
    ...mapGetters('solution', [
      'list',
      'sum',
      'codeDialog'
    ]),
    query () {
      const opt = only(this.$route.query, 'page pageSize uid pid language judge')
      return purify(opt)
    }
  },
  methods: {
    showDialog (solution) {
      this.$store.commit('solution/SHOW_CODE', solution)
    },
    fetch () {
      const query = this.$route.query
      this.$store.dispatch('solution/find', query)
      this.page = parseInt(query.page) || 1
      this.pageSize = parseInt(query.pageSize) || 30
      this.uid = query.uid
      this.pid = query.pid || ''
      this.judge = query.judge || ''
      this.language = query.language || ''
    },
    reload (payload = {}) {
      // console.log(this.$route.query)
      // console.log(this.query)
      const query = Object.assign(this.query, purify(payload))
      // console.log(query)
      // console.log(this.$route.query)
      this.$router.push({
        name: 'status',
        query
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
  },
  components: {
    // Solution
  }
}
</script>

<style lang="stylus">
.status-wrap
  .filter
    margin-bottom: 20px
    label
      height: 32px
      line-height: 32px
    .ivu-col
      text-align: center
    .ivu-select-item
      text-align: left
  .pagination
    margin-bottom: 10px
  table
    width: 100%
    border-collapse: collapse
    border-spacing: 0
    th:nth-child(1)
      padding-left: 10px
    //   width: 5%
    // th:nth-child(2)
    //   width: 10%
    // th:nth-child(3)
    //   width: 20%
    // th:nth-child(4)
    //   width: 20%
    // th:nth-child(5)
    //   width: 10%
    // th:nth-child(6)
    //   width: 10%
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
