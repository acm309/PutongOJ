<template lang="html">
  <div>
    <i-switch size="large" @on-change="change">
        <Icon type="android-done" slot="open"></Icon>
        <Icon type="android-close" slot="close"></Icon>
    </i-switch> 自动刷新 (每 10 秒一次)
    <div class="conrank-wrap">
      <table>
        <tr>
          <th>#</th>
          <th>User</th>
          <th>Nick</th>
          <th>Solve</th>
          <th>Penalty</th>
          <th v-for="(item, index) in contest.list">
            {{ index + 1 }}
          </th>
        </tr>
        <tr v-for="(item, index) in ranklist">
          <td>{{ index + 1 }}</td>
          <td>{{ item.uid }}</td>
          <td>{{ item.nick }}</td>
          <td>{{ item.solved }}</td>
          <td class="straight">{{ item.penalty | timeContest }}</td>
          <template v-for="pid in contest.list">
            <td v-if="!item[pid]"></td>
            <!-- !item[pid] 为 true 表示这道题没有提交过 -->
            <td v-else-if="item[pid].wa >= 0" :class="[ item[pid].prime ? 'prime' : 'normal']">
              {{ item[pid].create - contest.start | timeContest }}<span v-if="item[pid].wa">({{ item[pid].wa }})</span>
            </td>
            <td v-else :class="{'red': item[pid].wa}">
              <span v-if="item[pid].wa">{{ item[pid].wa }}</span>
            </td>
          </template>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data: () => ({
    timer: null
  }),
  computed: {
    ...mapGetters('contest', [ 'ranklist', 'contest' ])
  },
  created () {
    this.getRank()
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    getRank () {
      this.$store.dispatch('contest/getRank', this.$route.params)
    },
    change (status) {
      if (status) {
        this.timer = setInterval(() => {
          this.getRank()
          this.$Message.info({
            content: '刷新成功',
            duration: 1
          })
        }, 10000)
      } else {
        clearInterval(this.timer)
      }
    }
  }
}
</script>

<style lang="stylus">
.conrank-wrap
  margin-top: 1em
  overflow: scroll
  table
    width: 100%
    border-collapse: collapse
    border-spacing: 0
    th, td
      border: 1px solid #dbdbdb
      padding: 8px 4px
      &:nth-child(n + 5)
        min-width: 4em
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
