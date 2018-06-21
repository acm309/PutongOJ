<template lang="html">
  <div class="rank-wrap">
    <Row style="margin-bottom: 20px" type="flex" justify="end">
      <Col :span="1"><label>Group</label></Col>
      <Col :span="3">
        <Select v-model="group">
          <Option v-for="item in groupList" :value="item.gid" :key="item.gid">{{ item.title }}</Option>
        </Select>
      </Col>
      <Col :span="2">
        <Button type="primary" @click="search">Search</Button>
      </Col>
    </Row>
    <table>
      <tr>
        <th>Rank</th>
        <th>Username</th>
        <th>Nick</th>
        <th>Motto</th>
        <th>Solve</th>
        <th>Submit</th>
        <th>Ratio</th>
      </tr>
      <tr v-for="(item, index) in list" :key="item.uid">
        <td>{{ index + 1 + (page -1) * pageSize }}</td>
        <td>
          <router-link :to="{ name: 'userInfo', params: { uid: item.uid } }">
            <Button type="text">{{ item.uid }}</Button>
          </router-link>
        </td>
        <td>{{ item.nick }}</td>
        <td>{{ item.motto }}</td>
        <td>
          <router-link :to="{ name: 'status', params: { uid: item.uid, judge: judge.Accepted } }">
            <Button type="text">{{ item.solve }}</Button>
          </router-link>
        </td>
        <td>
          <router-link :to="{ name: 'status', params: { uid: item.uid } }">
            <Button type="text">{{ item.submit }}</Button>
          </router-link>
        <td>
          <span>{{ item.solve / (item.submit + 0.0000001) | formate }}</span>
        </td>
      </tr>
    </table>
    <Page :total="sum"
      @on-change="pageChange"
      :page-size="pageSize"
      :current.sync="page"
      show-elevator>
    </Page>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import only from 'only'
import { purify } from '@/util/helper'

export default {
  data () {
    return {
      page: parseInt(this.$route.query.page) || 1,
      pageSize: parseInt(this.$route.query.pageSize) || 30,
      group: '',
      groupList: []
    }
  },
  computed: {
    ...mapGetters({
      list: 'ranklist/list',
      sum: 'ranklist/sum',
      groups: 'group/list',
      judge: 'judge'
    }),
    query () {
      const opt = Object.assign(
        only(this.$route.query, 'page pageSize'),
        { gid: this.group }
      )
      return purify(opt)
    }
  },
  created () {
    this.fetch()
  },
  methods: {
    fetch () {
      this.$store.dispatch('ranklist/find', this.query)
      this.$store.dispatch('group/find').then(() => {
        this.groupList = [{
          gid: '',
          title: 'ALL'
        }]
        this.groups.map((item) => {
          this.groupList.push(item)
        })
      })
      const query = this.$route.query
      this.page = parseInt(query.page) || 1
      this.pageSize = parseInt(query.pageSize) || 30
    },
    reload (payload = {}) {
      const query = Object.assign(this.query, payload)
      this.$router.push({
        name: 'ranklist',
        query
      })
    },
    pageChange (val) {
      this.reload({ page: val })
    },
    indexMethod (index) {
      return index + 1 + (this.page - 1) * this.pageSize
    },
    search () {
      this.reload({
        gid: this.group,
        page: 1
      })
    }
  },
  watch: {
    '$route' (to, from) {
      if (to !== from) this.fetch()
    }
  }
}
</script>

<style lang="stylus">
@import '../styles/common'

.rank-wrap
  margin-bottom: 20px
  label
    line-height: 30px
  table
    margin-bottom: 20px
    td
      word-break: break-all
      line-height: 20px
      font-size: 14px
    td:nth-child(4)
      width: 50%
      padding-right: 10px
</style>
