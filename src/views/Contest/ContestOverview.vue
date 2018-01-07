<template lang="html">
  <div class="conover-wrap">
    <h3>{{ contest.title }}</h3>
    <p>Start Time:&nbsp;&nbsp;{{ contest.create | timePretty }}</p>
    <p>End Time:&nbsp;&nbsp;{{ contest.end | timePretty }}</p>
    <table>
      <tr>
        <th>ID</th>
        <th>Title</th>
        <th>Ratio</th>
      </tr>
      <tr v-for="(item, index) in overview" :key="item.pid">
        <td>{{ index + 1 }}</td>
        <td>
          <router-link :to="{ name: '', params: { cid: cid, id: scope.$index + 1 } }">
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
    ...mapGetters('contest', {
      contest: 'one',
      overview: 'overview'
    })
  },
  created () {
    this.$store.dispatch('contest/find', this.$route.params)
  }
}
</script>

<style lang="stylus">
  .conover-wrap
    .eltable
      margin-bottom: 20px
    .el-table th
      padding: 8px 0
    .el-table td
      padding: 2px 0
</style>
