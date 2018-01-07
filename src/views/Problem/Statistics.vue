<template lang="html">
  <div class="statis-wrap">
    <div class="left">
      <table>
        <tr>
          <th class="t1">Result</th>
          <th class="t2">Amount</th>
        </tr>
        <tr>
          <td class="t1">Total Submissions</td>
          <td class="t2">
            <router-link :to="{ name: 'status', query: { pid } }">
              {{ sumCharts }}
            </router-link>
          </td>
        </tr>
      </table>
      <div id="myChart" class="charts"></div>
      <table>
        <tr v-for="(item, index) in countList">
          <td class="t1">{{ name[index] }}</td>
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
        <tr v-for="(item, index) in list">
          <td>{{ index + 1 }}</td>
          <td>
            <router-link :to="{ name: '', params: { uid: item.uid } }">
              <Button type="text">{{ item.uid }}</Button>
            </router-link>
          </td>
          <td>
            {{ item.time }}
          </td>
          <td>{{ item.memory }}</td>
          <td>{{ item.length }}</td>
          <td>
            <router-link :to="{ name: 'solution', params: { sid: item.sid } }">
              <Button type="text">{{ lang[item.language] }}</Button>
            </router-link>
          </td>
          <td>{{ item.create | timePretty }}</td>
        </tr>
      </table>
      <Page :total="sumStatis"
        @on-change="handleCurrentChange"
        :page-size="pageSize"
        :current.sync="currentPage"
        show-elevator>
      </Page>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import constant from '@/util/constant.js'
import echarts from 'echarts'
// let echarts = require('echarts/lib/echarts')

export default {
  data () {
    return {
      name: constant.statisTableObj,
      lang: constant.language,
      currentPage: 1,
      pageSize: 20,
      pid: ''
    }
  },
  computed: {
    ...mapGetters('statistics', [
      'list',
      'countList',
      'sumCharts',
      'sumStatis'
    ])
  },
  created () {
    this.getStatistics()
    this.pid = this.$route.params.pid
  },
  mounted () {
    let drawLine = this.drawLine()
    window.onresize = () => drawLine.resize() // 重绘，窗口大小改动时
  },
  methods: {
    getStatistics () {
      let opt = {
        page: this.currentPage,
        pageSize: this.pageSize,
        pid: this.$route.params.pid
      }
      this.$store.dispatch('statistics/find', opt)
    },
    drawLine () {
      let myChart = echarts.init(document.getElementById('myChart'))
      myChart.setOption({
        title: {
          text: 'Statistics for ' + this.$route.params.pid,
          x: 'center',
          y: 'top'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b} </br>{d}%'
        },
        legend: {
          orient: 'horizontal',
          x: 'center',
          y: 'bottom',
          data: ['CE', 'AC', 'RE', 'WA', 'TLE', 'MLE', 'OLE', 'PE', 'SE']
        },
        calculable: true,
        series: [
          {
            name: 'Statistics',
            type: 'pie',
            radius: '55%',
            center: ['50%', '50%'],
            data: [
              {value: this.countList[0], name: 'CE'},
              {value: this.countList[1], name: 'AC'},
              {value: this.countList[2], name: 'RE'},
              {value: this.countList[3], name: 'WA'},
              {value: this.countList[4], name: 'TLE'},
              {value: this.countList[5], name: 'MLE'},
              {value: this.countList[6], name: 'OLE'},
              {value: this.countList[7], name: 'PE'},
              {value: this.countList[8], name: 'SE'}
            ]
          }
        ]
      })
      return myChart
    },
    handleCurrentChange (val) {
      this.currentPage = val
      this.getStatistics()
    },
    handleSizeChange (val) {
      this.pageSize = val
      this.getStatistics()
    },
    indexMethod (index) {
      return index + 1 + (this.currentPage - 1) * this.pageSize
    }
  }
}
</script>

<style lang="stylus">
  .statis-wrap
    display: flex
    justify-content: space-around
    .left
      margin-bottom: 20px
      margin-right: 3%
      width: 32%
      table
        width: 100%
        border-collapse: collapse
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
      .charts
        height: 420px
        width: 95%
        margin-top: 10px
        margin-bottom: 20px
    .right
      width: 65%
      margin-bottom: 20px
      margin-right: 0
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
