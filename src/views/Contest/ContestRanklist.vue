<script setup>
import { inject, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useContestStore } from '@/store/modules/contest'
import { timeContest } from '@/util/formate'

const { t } = useI18n()
const contestStore = useContestStore()
const route = useRoute()
const $Message = inject('$Message')

const { contest, ranklist } = $(storeToRefs(contestStore))
const { getRank: getRanklist } = contestStore
let timer = $ref(null)

const getRank = () => getRanklist(route.params)

function change (enabled) {
  if (enabled) {
    timer = setInterval(() => {
      getRank()
      $Message.info({
        content: t('oj.refreshed'),
        duration: 1,
      })
    }, 10000)
  } else {
    clearInterval(timer)
  }
}

getRank()
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div>
    <i-switch size="large" @on-change="change">
      <!-- <Icon slot="open" type="android-done" />
      <Icon slot="close" type="android-close" /> -->
    </i-switch> {{ t('oj.auto_refresh') }}
    <div class="conrank-wrap">
      <table>
        <tr>
          <th>#</th>
          <th>User</th>
          <th>Nick</th>
          <th>Solve</th>
          <th>Penalty</th>
          <th v-for="(item, index) in contest.list" :key="index">
            {{ index + 1 }}
          </th>
        </tr>
        <tr v-for="(item, index) in ranklist" :key="item.uid">
          <td>{{ index + 1 }}</td>
          <td>{{ item.uid }}</td>
          <td>{{ item.nick }}</td>
          <td>{{ item.solved }}</td>
          <td class="straight">
            {{ timeContest(item.penalty) }}
          </td>
          <template v-for="pid in contest.list">
            <td v-if="!item[pid]" :key="`${pid} ${1}`" />
            <!-- !item[pid] 为 true 表示这道题没有提交过 -->
            <td v-else-if="item[pid].wa >= 0" :key="`${pid} ${2}`" :class="[ item[pid].prime ? 'prime' : 'normal' ]">
              {{ timeContest(item[pid].create - contest.start) }}<span v-if="item[pid].wa">({{ item[pid].wa }})</span>
            </td>
            <td v-else :key="`${pid} ${3}`" :class="{ red: item[pid].wa }">
              <span v-if="item[pid].wa">{{ item[pid].wa }}</span>
            </td>
          </template>
        </tr>
      </table>
    </div>
  </div>
</template>

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
