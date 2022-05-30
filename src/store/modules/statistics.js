import { defineStore } from 'pinia'
import api from '@/api'
import constant from '@/util/constant'

export const useStatisticsStore = defineStore('statistics', {
  state: () => ({
    list: [],
    countList: [],
    sumCharts: 0,
    table: [],
    sumStatis: 0,
  }),
  actions: {
    async find (payload) {
      const { data } = await api.getStatistics(payload)
      this.list = data.list
      this.countList = data.countList
      this.sumCharts = data.sumCharts
      this.sumStatis = data.sumStatis
      const obj = {
        name: 'Total Submissions',
        num: data.sumStatis,
      }
      this.table.push(obj)
      for (let i = 0; i < constant.statisTableObj.length; i++) {
        const obk = {}
        obk.name = constant.statisTableObj[i]
        obk.num = data.countList[i]
        this.table.push(obk)
      }
    },
  },
})
