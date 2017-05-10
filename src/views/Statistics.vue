<template lang="html">
  <div>
    <div class="tile is-ancestor">

      <div class="tile is-4 is-vertical is-parent">
        <div class="tile is-child box">
          <table class="table">
            <thead>
              <th>Result</th>
              <th>Amount</th>
            </thead>
            <tbody>
              <tr>
                <td>Total Submissions</td>
                <td>{{ sum }}</td>
              </tr>
              <tr>
                <td colspan="2">
                  <div id="highcharts">
                  </div>
                </td>
              </tr>
              <tr v-for="(value, key, index) in statistics">
                <td>{{ judges[key] }}</td>
                <td>
                  <router-link
                    :to="{name:'status', query: {judge: key, pid: pid}}"
                  >
                    {{ value }}
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="tile is-parent" style="height: auto">
        <div class="tile is-child box">
          <table class="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Time</th>
                <th>Memory</th>
                <th>Length</th>
                <th>Lang</th>
                <th>Submit Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(solution, index) in solutions">
                <td>{{ index + 1 }}</td>
                <td>
                  <router-link
                    :to="{name: 'user', params: {uid: solution.uid}}"
                  >
                    {{ solution.uid }}
                  </router-link>
                </td>
                <td>{{ solution.time }} MS</td>
                <td>{{ solution.memory }} KB</td>
                <td>{{ solution.length }} B</td>
                <td>{{ solution.language | languagePretty }}</td>
                <td>{{ solution.create | timePretty }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import Highcharts from 'highcharts'

export default {
  props: ['pid'],
  data () {
    return {
      sum: 0
    }
  },
  computed: {
    statistics () {
      return this.$store.getters.statistics
    },
    solutions () {
      return this.$store.getters.statisticsSolution
    },
    judges () {
      return this.$store.getters.judges
    }
  },
  mounted () {
    this.$store.dispatch('fetchStatistics', { pid: this.pid })
      .then(() => {
        let data_set = []
        this.sum = 0;
        for (let key in this.statistics) {
          data_set.push({
            name: this.$store.getters.abbrJudges[key],
            y: + this.statistics[key]
          })
          this.sum += (+this.statistics[key])
        }
        const options = {
              chart: {
                  plotBackgroundColor: null,
                  plotBorderWidth: null,
                  plotShadow: false,
                  type: 'pie'
              },
              title: {
                  text: 'Statistics for Problem ' + this.$route.params.pid
              },
              tooltip: {
                  pointFormat: '<b>{point.percentage:.1f}%</b>'
              },
              credits: {
                enabled: false
              },
              plotOptions: {
                  pie: {
                      allowPointSelect: true,
                      cursor: 'pointer',
                      dataLabels: {
                          enabled: true,
                          format: '<b>{point.name}</b>',
                          style: {
                              color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                          }
                      },
                      showInLegend: true
                  }
              },
              series: [{
                  colorByPoint: true,
                  data: data_set
              }]
        }

        Highcharts.chart('highcharts', options)

      })
  }
}
</script>

<style lang="css">
</style>
