<template>
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
import { mapGetters, mapActions } from 'vuex'
import { useSessionStore } from '@/store/modules/session'
import { mapState } from 'pinia'

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
      solved: 'contest/solved'
    }),
    ...mapState(useSessionStore, ['profile']),
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
    this.changeDomTitle({ title: `Contest ${this.$route.params.cid}` })
  },
  methods: {
    ...mapActions(['changeDomTitle']),
    fetch () {
      this.$store.dispatch('contest/findOne', this.query)
    }
  },
  watch: { // 浏览器后退时回退页面
    '$route' (to, from) {
      if (to !== from) this.fetch()
    },
    'profile' (val) {
      this.$store.dispatch('contest/findOne', this.query)
    }
  }
}
</script>
<style lang="stylus" scoped>
@import '../../styles/common'

h2
  text-align: center
  margin-top: 10px
  margin-bottom: 8px
h4
  text-align: center
  margin-bottom: 8px
table
  margin-bottom: 20px
</style>
