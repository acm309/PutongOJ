<script setup>
import Chart from 'vue-echarts'
import 'echarts/lib/chart/pie'
import 'echarts/lib/component/title'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/legend'
import { storeToRefs } from 'pinia'
import { CanvasRenderer } from 'echarts/renderers'
import { use } from 'echarts/core'
import {
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { PieChart } from 'echarts/charts'
import { useRoute, useRouter } from 'vue-router'
import { useStatisticsStore } from '@/store/modules/statistics'
import { useSessionStore } from '@/store/modules/session'
import constant from '@/util/constant'
import { useRootStore } from '@/store'
import { timePretty } from '@/util/formate'
import { onRouteQueryUpdate } from '@/util/helper'

use([
  TooltipComponent,
  PieChart,
  CanvasRenderer,
  TitleComponent,
  LegendComponent,
])

const sessionStore = useSessionStore()
const statisticsStore = useStatisticsStore()
const rootStore = useRootStore()
const route = useRoute()
const router = useRouter()

const name = constant.statisTableObj
const lang = constant.language
const { list, countList, sumCharts, sumStatis } = $(storeToRefs(statisticsStore))
const { changeDomTitle } = rootStore
const { profile, isAdmin } = $(storeToRefs(sessionStore))
const { find } = statisticsStore
const pid = $computed(() => route.params.pid)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 20)
const currentPage = $computed(() => Number.parseInt(route.query.page) || 1)

const pie = $computed(() => {
  const data = {
    title: {
      text: `Statistics for ${route.params.pid}`,
      x: 'center',
      y: 'top',
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b} </br>{d}%',
    },
    legend: {
      orient: 'horizontal',
      x: 'center',
      y: 'bottom',
      data: [ 'CE', 'AC', 'RE', 'WA', 'TLE', 'MLE', 'OLE', 'PE', 'SE' ],
    },
    calculable: true,
    series: [
      {
        name: 'Statistics',
        type: 'pie',
        radius: '55%',
        center: [ '50%', '50%' ],
        data: [
          { value: countList[0] || 0, name: 'CE' },
          { value: countList[1] || 0, name: 'AC' },
          { value: countList[2] || 0, name: 'RE' },
          { value: countList[3] || 0, name: 'WA' },
          { value: countList[4] || 0, name: 'TLE' },
          { value: countList[5] || 0, name: 'MLE' },
          { value: countList[6] || 0, name: 'OLE' },
          { value: countList[7] || 0, name: 'PE' },
          { value: countList[8] || 0, name: 'SE' },
        ],
      },
    ],
  }
  return data
})

function getStatistics () {
// https://github.com/Justineo/vue-echarts/blob/master/demo/Demo.vue
  const opt = {
    page: route.query.page || 1,
    pageSize: route.query.pageSize || 20,
    pid: route.params.pid,
  }
  find(opt)
}

function handleCurrentChange (val) {
  router.push({
    name: 'problemStatistics',
    params: { pid: route.params.pid },
    query: {
      page: val,
      pageSize: route.query.pageSize || 20,
    },
  })
  getStatistics()
}

getStatistics()
changeDomTitle({ title: `Problem ${route.params.pid}` })
onRouteQueryUpdate(getStatistics)
</script>

<template>
  <div class="statis-wrap">
    <div class="left">
      <table>
        <tr>
          <th class="t1">
            Result
          </th>
          <th class="t2">
            Amount
          </th>
        </tr>
        <tr>
          <td class="t1">
            Total Submissions
          </td>
          <td class="t2">
            <router-link :to="{ name: 'status', query: { pid } }">
              {{ sumCharts }}
            </router-link>
          </td>
        </tr>
      </table>
      <Chart ref="pie" :option="pie" auto-resize />
      <table>
        <tr v-for="(item, index) in countList" :key="index">
          <td class="t1">
            {{ name[index] }}
          </td>
          <td class="t2">
            <router-link :to="{ name: 'status', query: { pid, judge: index + 2 } }">
              {{ item }}
            </router-link>
          </td>
        </tr>
      </table>
    </div>
    <div class="right">
      <table>
        <tr>
          <th>Rank</th>
          <th>Username</th>
          <th>Time</th>
          <th>Memory</th>
          <th>Length</th>
          <th>Lang</th>
          <th>Submit Time</th>
        </tr>
        <tr v-for="(item, index) in list" :key="index">
          <td>{{ index + 1 }}</td>
          <td>
            <router-link :to="{ name: 'userInfo', params: { uid: item.uid } }">
              <Button type="text">
                {{ item.uid }}
              </Button>
            </router-link>
          </td>
          <td>
            {{ item.time }}
          </td>
          <td>{{ item.memory }}</td>
          <td>{{ item.length }}</td>
          <td v-if="isAdmin || (profile && profile.uid === item.uid)">
            <router-link :to="{ name: 'solution', params: { sid: item.sid } }">
              {{ lang[item.language] }}
            </router-link>
          </td>
          <td v-else>
            {{ lang[item.language] }}
          </td>
          <td>{{ timePretty(item.create) }}</td>
        </tr>
      </table>
      <Page
        :model-value="currentPage"
        :total="sumStatis"
        :page-size="pageSize"
        show-elevator
        @on-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style lang="stylus">
.statis-wrap
  display: flex
  justify-content: space-around
  .left
    margin-bottom: 20px
    margin-right: 3%
    width: 32%
    table
      tr:hover
        background: #f5f7fa
      tr
        height: 37px
        border-bottom: 1px solid #e6ebf5
      td
        .t2
          cursor: pointer
          color: #e040fb
      .t1
        width: 60%
        padding-left: 30px
        text-align: left
      .t2
        width: 40%
        text-align: center
    .echarts
      height: 420px
      width: 95%
      margin-top: 10px
      margin-bottom: 20px
  .right
    width: 65%
    margin-bottom: 20px
    margin-right: 0
    table
      margin-bottom: 20px
  .ivu-btn
    vertical-align: baseline
    color: #e040fb
    padding: 0 1px
    font-size: 14px
</style>
