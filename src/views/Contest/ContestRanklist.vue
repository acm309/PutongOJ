<script setup lang="ts">
import type { ContestDetail, Ranklist, RanklistInfo } from '@/types'
import type { Message } from 'view-ui-plus'
import type { Ref } from 'vue'
import api from '@/api'
import { useContestStore } from '@/store/modules/contest'
import { timeContest, timePretty } from '@/util/formate'
import { normalize } from '@/util/ranklist'
import { storeToRefs } from 'pinia'
import { Alert, BackTop, Icon, Poptip, Space, Spin, Switch } from 'view-ui-plus'
import { inject, onBeforeMount, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const contestStore = useContestStore()
const route = useRoute()
const message = inject('$Message') as typeof Message

const cid = $computed(() => Number.parseInt(route.params.cid as string) || 1)
const contest = storeToRefs(contestStore).contest as Ref<ContestDetail>
const overview = storeToRefs(contestStore).overview as Ref<{ title: string, solve: number }[]>

const ranklist = ref({} as Ranklist)
const ranklistInfo = ref({} as RanklistInfo)
const loading = ref(false)

let autoRefresh: number | null = null
const AUTO_REFRESH_GAP = 10 * 1000

async function getRanklist () {
  loading.value = true
  try {
    const { data } = await api.contest.ranklist(cid)
    ranklist.value = normalize(data.ranklist, contest.value)
    ranklistInfo.value = data.info
  } finally {
    loading.value = false
  }
}

function setAutoRefresh (enabled: boolean) {
  if (enabled) {
    autoRefresh = setInterval(async () => {
      await getRanklist()
      message.info({
        content: t('oj.refreshed'),
        duration: 1,
      })
    }, AUTO_REFRESH_GAP)
  } else {
    clearAutoRefresh()
  }
}

function clearAutoRefresh () {
  autoRefresh && clearInterval(autoRefresh)
}

onBeforeMount(getRanklist)
onBeforeUnmount(clearAutoRefresh)
</script>

<template>
  <div class="contest-children">
    <div class="board-header">
      <Space>
        <Button size="small" shape="circle" type="primary" :loading="loading" icon="ios-refresh" @click="getRanklist" />
        <Switch @on-change="setAutoRefresh">
          <template #open>
            <Icon type="md-checkmark" />
          </template>
          <template #close>
            <Icon type="md-close" />
          </template>
        </Switch>
        <span>{{ t('oj.auto_refresh') }}</span>
      </Space>
      <Alert v-if="ranklistInfo.isFrozen" type="info" style="margin-top: 14px" show-icon>
        {{ t('oj.ranklist_frozen', { time: timePretty(ranklistInfo.freezeTime) }) }}
      </Alert>
    </div>
    <div class="board-table-container">
      <table class="board-table">
        <thead>
          <tr>
            <th class="table-rank">
              #
            </th>
            <th class="table-uid">
              User
            </th>
            <th class="table-nick">
              Nick
            </th>
            <th class="table-solve">
              Solve
            </th>
            <th class="table-penalty">
              Penalty
            </th>
            <th v-for="(item, index) in overview" :key="index" class="table-problem">
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
            <td class="table-rank">
              {{ index + 1 }}
            </td>
            <td class="table-uid">
              <router-link :to="{ name: 'userProfile', params: { uid: item.uid } }">
                {{ item.uid }}
              </router-link>
            </td>
            <td class="table-nick">
              {{ item.nick }}
            </td>
            <td class="table-solve">
              {{ item.solved }}
            </td>
            <td class="table-penalty">
              {{ timeContest(item.penalty) }}
            </td>
            <template v-for="(pid, pindex) in contest.list">
              <td v-if="!item[pid]" :key="`${pid} ${1}`" class="table-problem" />
              <td
                v-else-if="item[pid].accepted > -1" :key="`${pid} ${2}`" class="table-problem"
                :class="[item[pid].isPrime ? 'prime' : 'normal']"
              >
                <router-link
                  :to="{ name: 'contestStatus', params: { cid }, query: { uid: item.uid, pid: pindex + 1 } }"
                >
                  <span class="cell-accept">{{ item[pid].failed > 0 ? `+${item[pid].failed}` : '+' }}</span>
                  <span class="cell-time">{{ timeContest(item[pid].accepted - contest.start) }}</span>
                </router-link>
              </td>
              <td v-else :key="`${pid} ${3}`" class="table-problem">
                <router-link
                  :to="{ name: 'contestStatus', params: { cid }, query: { uid: item.uid, pid: pindex + 1 } }"
                >
                  <Space>
                    <span v-if="item[pid].failed" class="cell-failed">-{{ item[pid].failed }}</span>
                    <span v-if="item[pid].pending" class="cell-pending">+{{ item[pid].pending }}</span>
                  </Space>
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
    height 60px
  tbody tr
    transition background-color 0.2s ease
    td.table-problem
      transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7

.table-rank, .table-solve
  min-width 70px
.table-uid
  width 140px
  max-width 140px
  text-align center
  white-space nowrap
  text-overflow ellipsis
  overflow hidden
.table-nick
  min-width 210px
  line-break anywhere
td.table-nick
  text-align left
.table-penalty
  min-width 105px
  white-space nowrap
.table-problem
  min-width 70px
  .cell-accept, .cell-time, .cell-solve, .cell-pid
    display block
    width 100%
  .cell-accept, .cell-failed, .cell-pending
    font-weight bold
  .cell-time, .cell-solve
    font-size 12px
  .cell-pid
    color #515a6e
  .cell-solve
    color #9c9fa5
  .cell-failed
    color red
  .cell-pending
    color hsl(200 80% 45%)

.table-problem, .table-rank,
td.table-solve, td.table-penalty
  font-family var(--font-verdana)

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
</style>
