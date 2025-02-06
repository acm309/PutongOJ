<script setup>
import { inject, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useContestStore } from '@/store/modules/contest'
import { timeContest } from '@/util/formate'

import { Switch, Icon, Space, Spin, Poptip, BackTop } from 'view-ui-plus'

const { t } = useI18n()
const contestStore = useContestStore()
const route = useRoute()
const $Message = inject('$Message')

const { contest, overview, ranklist } = $(storeToRefs(contestStore))
const { getRank: getRanklist } = contestStore
const cid = $computed(() => Number.parseInt(route.params.cid || 1))

let timer = $ref(null)
let loading = $ref(false)

async function getRank() {
  loading = true
  await getRanklist(route.params)
  loading = false
}

function change(enabled) {
  if (enabled) {
    timer = setInterval(async () => {
      await getRank()
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
  <div class="contest-children">
    <Space class="board-header">
      <Button size="small" shape="circle" type="primary" :loading="loading" icon="ios-refresh" @click="getRank" />
      <Switch @on-change="change">
        <template #open>
          <Icon type="md-checkmark"></Icon>
        </template>
        <template #close>
          <Icon type="md-close"></Icon>
        </template>
      </Switch>
      <span>{{ t('oj.auto_refresh') }}</span>
    </Space>
    <div class="board-table-container">
      <table class="board-table">
        <thead>
          <tr>
            <th class="table-rank">#</th>
            <th class="table-uid">User</th>
            <th class="table-nick">Nick</th>
            <th class="table-solve">Solve</th>
            <th class="table-penalty">Penalty</th>
            <th class="table-problem" v-for="(item, index) in overview" :key="index">
              <Poptip trigger="hover" placement="bottom">
                <router-link :to="{ name: 'contestProblem', params: { cid, id: index + 1 } }">
                  <span class="cell-pid">{{ index + 1 }}</span>
                  <span class="cell-solve">{{ item.solve }}</span>
                </router-link>
                <template #content>
                  {{ item.title }}
                </template>
              </Poptip>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in ranklist" :key="item.uid">
            <td class="table-rank">{{ index + 1 }}</td>
            <td class="table-uid">
              <router-link :to="{ name: 'userInfo', params: { uid: item.uid } }">
                {{ item.uid }}
              </router-link>
            </td>
            <td class="table-nick">{{ item.nick }}</td>
            <td class="table-solve">{{ item.solved }}</td>
            <td class="table-penalty">{{ timeContest(item.penalty) }}</td>
            <template v-for="(pid, pindex) in contest.list">
              <td class="table-problem" v-if="!item[pid]" :key="`${pid} ${1}`"></td>
              <td class="table-problem" v-else-if="item[pid].wa >= 0" :key="`${pid} ${2}`"
                :class="[item[pid].prime ? 'prime' : 'normal']">
                <router-link
                  :to="{ name: 'contestStatus', params: { cid }, query: { uid: item.uid, pid: pindex + 1 } }">
                  <span class="cell-accept">{{ item[pid].wa ? '+' + item[pid].wa : '+' }}</span>
                  <span class="cell-time">{{ timeContest(item[pid].create - contest.start) }}</span>
                </router-link>
              </td>
              <td class="table-problem" v-else :key="`${pid} ${3}`" :class="{ red: item[pid].wa }">
                <router-link
                  :to="{ name: 'contestStatus', params: { cid }, query: { uid: item.uid, pid: pindex + 1 } }">
                  <span v-if="item[pid].wa">{{ item[pid].wa }}</span>
                </router-link>
              </td>
            </template>
          </tr>
          <Spin size="large" fix :show="loading" />
        </tbody>
      </table>
    </div>
    <BackTop />
  </div>
</template>

<style lang="stylus" scoped>
@media screen and (max-width: 768px)
  .contest-children
    padding 0
  .board-header
    padding 0 16px
  .board-table-container
    border-radius 0 !important
    border-bottom 0 !important
    border-left 0 !important
    border-right 0 !important

.board-table-container
  overflow-x auto
  width 100%
  margin-top 1em
  display block
  border 1px solid #dbdbdb
  border-radius 4px
  
.board-table
  min-width 100%
  table-layout fixed
  border-collapse collapse
  border-spacing 0
  position relative
  th, td
    border 1px solid #dbdbdb
    padding 8px
    text-align center
  tr>th:first-child, tr>td:first-child
    border-left 0
  tr>th:last-child, tr>td:last-child
    border-right 0
  &>thead>tr:first-child>th
    border-top 0
  &>tbody>tr:last-child>td
    border-bottom 0
  tr
    height 56px
  tbody tr
    transition background-color 0.2s ease
    td.table-problem
      transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7

.table-rank
  min-width 50px
.table-uid
  width 170px
  max-width 170px
  text-align center
  white-space nowrap
  text-overflow ellipsis
  overflow hidden
.table-nick
  min-width 200px
  line-break anywhere
td.table-nick
  text-align left
.table-solve
  min-width 70px
.table-penalty
  min-width 100px
  white-space nowrap
.table-problem
  min-width 70px
  .cell-accept, .cell-time, .cell-solve, .cell-pid
    display block
    width 100%
  .cell-accept
    font-weight bold
  .cell-time, .cell-solve
    font-size 12px
  .cell-pid
    color #515a6e
  .cell-solve
    color #9c9fa5

.table-problem, .table-rank, 
td.table-solve, td.table-penalty
  font-family verdana, arial, sans-serif  

.prime
  background-color hsl(200 80% 45%)
  &:hover
    background-color hsl(200 80% 40%)
.normal
  background-color hsl(150 80% 45%)
  &:hover
    background-color hsl(150 80% 40%)
.prime, .normal
  .cell-accept, .cell-time
    color white
.red>a
  color red
</style>
