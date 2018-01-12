<template lang="html">
  <div class="conover-wrap">
    <h2>{{ contest.title }}</h2>
    <h4>Start Time:&nbsp;&nbsp;{{ contest.create | timePretty }}</h4>
    <h4>End Time:&nbsp;&nbsp;{{ contest.end | timePretty }}</h4>
    <table>
      <tr>
        <th>#</th>
        <th>ID</th>
        <th>Title</th>
        <th>Ratio</th>
      </tr>
      <tr v-for="(item, index) in overview" :key="item.pid">
        <td>
          <Icon v-if="solved.indexOf(item.pid) !== -1" type="checkmark-round"></Icon>
        </td>
        <td>{{ index + 1 }}</td>
        <td>
          <router-link :to="{ name: 'contestProblem', params: { cid: cid, id: index + 1 } }">
            <Button type="text">{{ item.title }}</Button>
          </router-link>
        <td>
          <span>{{ item.solve / (item.submit + 0.000001) | formate }}</span>&nbsp;
          ({{ item.solve }} / {{ item.submit }})
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      cid: this.$route.params.cid
    }
  },
  computed: {
    ...mapGetters({
      contest: 'contest/contest',
      overview: 'contest/overview',
      solved: 'contest/solved',
      profile: 'session/profile'
    }),
    query () {
      let uid
      if (this.profile) {
        uid = this.profile.uid
      }
      const opt = {
        cid: this.$route.params.cid,
        uid
      }
      return opt
    }
  },
  created () {
    this.fetch()
  },
  methods: {
    fetch () {
      this.$store.dispatch('contest/find', this.query)
    }
  },
  watch: { // 浏览器后退时回退页面
    '$route' (to, from) {
      if (to !== from) this.fetch()
    },
    'profile' (val) {
      this.$store.dispatch('contest/find', this.query)
    }
  }
}
</script>

<style lang="stylus">
  .conover-wrap
    h2
      text-align: center
      margin-top: 10px
      margin-bottom: 8px
    h4
      text-align: center
      margin-bottom: 8px
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
