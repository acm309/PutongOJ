import * as types from '../types.js'
import api from '@/api'
import { statisTableObj } from '@/util/constant'

const store = {
  namespaced: true,
  state: {
    list: [],
    countList: [],
    sumCharts: 0,
    table: [],
    sumStatis: 0
  },
  getters: {
    list: state => state.list,
    countList: state => state.countList,
    sumCharts: state => state.sumCharts,
    table: state => state.table,
    sumStatis: state => state.sumStatis
  },
  mutations: {
    [types.UPDATE_STATISTICS_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.UPDATE_COUNT_LIST]: (state, payload) => {
      state.countList = payload
    },
    [types.UPDATE_STATISTICS_TOTAL]: (state, payload) => {
      state.sumStatis = payload
    },
    [types.UPDATE_STATISTICS_CHARTS]: (state, payload) => {
      state.sumCharts = payload
    },
    [types.UPDATE_STATISTICS_TABLE]: (state, payload) => {
      let obj = {
        name: 'Total Submissions',
        num: payload.sumStatis
      }
      state.table.push(obj)
      for (let i = 0; i < statisTableObj.length; i++) {
        let obk = {}
        obk.name = statisTableObj[i]
        obk.num = payload.countList[i]
        state.table.push(obk)
      }
    }
  },
  actions: {
    find ({ commit }, payload) {
      return api.getStatistics(payload).then(({ data }) => {
        commit(types.UPDATE_STATISTICS_LIST, data.list)
        commit(types.UPDATE_COUNT_LIST, data.countList)
        commit(types.UPDATE_STATISTICS_CHARTS, data.sumCharts)
        commit(types.UPDATE_STATISTICS_TABLE, data)
        commit(types.UPDATE_STATISTICS_TOTAL, data.sumStatis)
      })
    }
  }
}

export default store
