<template lang="html">
  <div class="conrank-wrap">
    <table>
      <tr>
        <th>#</th>
        <th>User</th>
        <th>Nick</th>
        <th>Solve</th>
        <th>Penalty</th>
        <th v-for="(item, index) in problems">
          {{ index + 1 }}
        </th>
      </tr>
      <tr v-for="(item, index) in ranklist">
        <td>{{ index + 1 }}</td>
        <td>{{ item.uid }}</td>
        <td>{{ item.nick }}</td>
        <td>{{ item.solved }}</td>
        <td class="straight">{{ item.penalty | timeContest }}</td>
        <template v-for="(pro, index2) in problems">
          <td v-if="item.pro.create" :class="[ item.pro.prime ? 'prime' : 'normal']">
            {{ item.pro.create | timeContest }}<span v-if="item.pro.wa">({{ item.pro.wa }})</span>
          </td>
          <td v-else :class="{'red': item.pro.wa}">
            <span v-if="item.pro.wa">-{{ item.pro.wa }}</span>
          </td>
        </template>
      </tr>
    </table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('contest', {
      ranklist: 'ranklist',
      problems: 'problems'
    })
  },
  created () {
    this.$store.dispatch('contest/getRank', this.$route.params).then(
      console.log(this.problems)
    )
  }
}
</script>

<style lang="stylus">
  .conrank-wrap
    table
      width: 100%
      border-collapse: collapse
      border-spacing: 0
      th, td
        border: 1px solid #dbdbdb
        padding: 8px 4px
    .straight
      nowrap: nowrap
    .prime
      color: #fff
      background-color: #3273dc
      word-wrap: break-word
      word-break:break-all
      text-align: left
    .normal
      color: #fff
      background-color: #23d160
      word-wrap: break-word
      word-break:break-all
      text-align: left
    .red
      color: red
</style>
