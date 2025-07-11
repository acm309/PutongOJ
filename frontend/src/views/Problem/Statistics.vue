<script setup>
import { PieChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'

import { SVGRenderer } from 'echarts/renderers'
import { storeToRefs } from 'pinia'
import { Badge, Icon, Page, Spin } from 'view-ui-plus'
import Chart from 'vue-echarts'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { useRootStore } from '@/store'

import { useSessionStore } from '@/store/modules/session'
import { useStatisticsStore } from '@/store/modules/statistics'
import { language } from '@/util/constant'
import { timePretty } from '@/util/formate'
import { onRouteQueryUpdate } from '@/util/helper'

use([
  LegendComponent,
  PieChart,
  SVGRenderer,
  TooltipComponent,
])

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const rootStore = useRootStore()
const sessionStore = useSessionStore()
const statisticsStore = useStatisticsStore()

const { changeDomTitle } = rootStore
const { find } = statisticsStore
const { profile, isAdmin } = $(storeToRefs(sessionStore))
const { list, countList, sumStatis } = $(storeToRefs(statisticsStore))

const pid = $computed(() => route.params.pid)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 20)
const currentPage = $computed(() => Number.parseInt(route.query.page) || 1)

const pieOption = $computed(() => {
  return {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      top: '5%',
      left: 'center',
      inactiveBorderColor: '#fff',
      inactiveBorderWidth: 2,
    },
    series: [
      {
        name: `Statistics of Problem ${pid}`,
        type: 'pie',
        radius: [ '45%', '70%' ],
        center: [ '50%', '55%' ],
        itemStyle: {
          borderRadius: 5,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        minAngle: 5,
        emphasis: {
          label: {
            show: true,
            fontSize: 40,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
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
})

let loading = $ref(false)

async function getStatistics () {
  loading = true
  const opt = {
    page: route.query.page || 1,
    pageSize: route.query.pageSize || 20,
    pid: route.params.pid,
  }
  await find(opt)
  loading = false
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
    <div class="statis-charts-contain">
      <Chart class="statis-charts" :option="pieOption" autoresize :loading="loading" />
    </div>
    <div class="statis-table-container">
      <table class="statis-table">
        <thead>
          <tr>
            <th class="statis-sid">
              SID
            </th>
            <th class="statis-username">
              Username
            </th>
            <th class="statis-time">
              <Badge>
                Time<template #count>
                  <span class="statis-badge">(ms)</span>
                </template>
              </Badge>
            </th>
            <th class="statis-memory">
              <Badge>
                Memory<template #count>
                  <span class="statis-badge">(KB)</span>
                </template>
              </Badge>
            </th>
            <th class="statis-language">
              Language
            </th>
            <th class="statis-submit-time">
              Submit Time
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="list.length === 0" class="statis-empty">
            <td colspan="6">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="item in list" :key="item.sid">
            <td v-if="isAdmin || (profile && profile.uid === item.uid)" class="statis-sid">
              <router-link :to="{ name: 'solution', params: { sid: item.sid } }">
                {{ item.sid }}
              </router-link>
            </td>
            <td v-else class="statis-sid">
              {{ item.sid }}
            </td>
            <td class="statis-username">
              <router-link :to="{ name: 'userProfile', params: { uid: item.uid } }">
                {{ item.uid }}
              </router-link>
            </td>
            <td class="statis-time">
              {{ item.time }}
            </td>
            <td class="statis-memory">
              {{ item.memory }}
            </td>
            <td class="statis-language">
              {{ language[item.language] }}
            </td>
            <td class="statis-submit-time">
              {{ timePretty(item.create) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="statis-footer">
      <Page
        class="statis-page-table" :model-value="currentPage" :total="sumStatis" :page-size="pageSize" show-elevator
        show-total @on-change="handleCurrentChange"
      />
      <Page
        class="statis-page-mobile" size="small" :model-value="currentPage" :total="sumStatis" :page-size="pageSize"
        show-elevator show-total @on-change="handleCurrentChange"
      />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'

.statis-charts-contain
  margin-top -20px
  padding 0 20px
  .statis-charts
    width 100%
    height 400px

.statis-wrap
  width 100%
  margin 0
  padding 0 0 40px

.statis-page
  flex none
.statis-page-mobile
  display none

@media screen and (max-width: 1024px)
  .statis-charts-contain
    margin-top 0
  .statis-wrap
    padding 0 0 20px
  .statis-footer
    padding 0 20px
    margin-top 20px !important

@media screen and (max-width: 768px)
  .statis-page-table
    display none
  .statis-page-mobile
    display block

.statis-table-container
  overflow-x auto
  width 100%
.statis-table
  width 100%
  min-width 800px
  table-layout fixed
  th, td
    padding 0 16px
  tbody tr
    transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7

.statis-sid
  width 110px
  text-align right
.statis-pid
  width 80px
  text-align right
.statis-username
  text-align left
  overflow hidden
.statis-time, .statis-memory
  width 100px
  text-align right
.statis-language
  width 110px
  text-align center
.statis-submit-time
  width 190px
.statis-sim-tag
  margin 0px 0px 4px 8px
.statis-badge
  position absolute
  font-size 8px
  top 10px
  right 8px

.statis-empty
  &:hover
    background-color transparent !important
  td
    margin-bottom 20px
    padding 32px !important
    border-radius 4px
    text-align center
    .empty-icon
      display block
      font-size 32px

.statis-footer
  padding 0 40px
  margin-top 40px
  text-align center
</style>
