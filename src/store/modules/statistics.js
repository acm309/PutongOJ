import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'
import constant from '@/util/constant'

export const useStatisticsStore = defineStore('statistics', () => {
  const list = ref([])
  const countList = ref([])
  const sumCharts = ref(0)
  const table = ref([])
  const sumStatis = ref(0)
  async function find (payload) {
    const { data } = await api.getStatistics(payload)
    // problemStatistics???
    list.value = data.list
    countList.value = data.countList
    sumCharts.value = data.sumCharts
    sumStatis.value = data.sumStatis
    const obj = {
      name: 'Total Submissions',
      num: data.sumStatis,
    }
    table.value.push(obj)
    for (let i = 0; i < constant.statisTableObj.length; i++) {
      const obk = {}
      obk.name = constant.statisTableObj[i]
      obk.num = data.countList[i]
      table.value.push(obk)
    }
  }
  return {
    list, countList, sumCharts, table, sumStatis, find,
  }
})
