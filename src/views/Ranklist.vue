<template lang="html">
  <div class="rank-wrap">
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
          <router-link :to="{ name: 'status', params: { uid: item.uid, judge: 3 } }">
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
import pickBy from 'lodash.pickby'

export default {
  data () {
    return {
      page: parseInt(this.$route.query.page) || 1,
      pageSize: parseInt(this.$route.query.pageSize) || 30
    }
  },
  computed: {
    ...mapGetters('ranklist', [
      'list',
      'sum'
    ]),
    query () {
      const opt = only(this.$route.query, 'page pageSize')
      return pickBy(
        opt,
        x => x != null && x !== ''
      )
    }
  },
  created () {
    this.fetch()
  },
  methods: {
    fetch () {
      this.$store.dispatch('ranklist/find', this.query)
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
    sizeChange (val) {
      this.reload({ pageSize: val })
    },
    pageChange (val) {
      this.reload({ page: val })
    },
    indexMethod (index) {
      return index + 1 + (this.page - 1) * this.pageSize
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
.rank-wrap
  margin-bottom: 20px
  table
    width: 100%
    margin-bottom: 20px
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
