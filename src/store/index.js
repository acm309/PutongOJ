import Vue from 'vue'
import Vuex from 'vuex'
import tag from './modules/tag'
import discuss from './modules/discuss'
import * as types from './types'
import api from '@/api'
import { defineStore } from 'pinia'

Vue.use(Vuex)

export const useRootStore = defineStore('root', {
  state: () => ({
    currentTime: Date.now(),
    website: {},
    privilege: {
      PrimaryUser: 1,
      Teacher: 2,
      Root: 3
    },
    status: {
      Reserve: 0,
      Available: 2
    },
    encrypt: {
      Public: 1,
      Private: 2,
      Password: 3
    },
    judge: {
      Pending: 0,
      Running: 1,
      CompileError: 2,
      Accepted: 3,
      RuntimeError: 4,
      WrongAnswer: 5,
      TimeLimitExceeded: 6,
      MemoryLimitExceed: 7,
      OutputLimitExceed: 8,
      PresentationError: 9,
      SystemError: 10,
      RejudgePending: 11
    }
  }),
  actions: {
    [types.SET_SERVERTIME] (payload) {
      this.currentTime = payload.serverTime
    },
    [types.UPDATE_SERVERTIME] (payload) {
      this.currentTime += payload.step
    },
    changeDomTitle (payload) {
      if (payload && payload.title) {
        window.document.title = payload.title
      }
      console.log(this.website.title)
      window.document.title += ` | ${this.website.title}`
    },
    fetchTime () {
      return api.getTime().then(({ data }) => {
        this[types.SET_SERVERTIME](data)
      })
    },
    updateTime () {
      setInterval(() => {
        this[types.UPDATE_SERVERTIME]({
          step: 1000
        })
      }, 1000)
    },
    fetchWebsiteConfig () {
      return api.getWebsiteConfig().then(({ data }) => {
        this.website = data.website
      })
    }
  }
})

const state = {
  currentTime: Date.now(),
  website: {}
}

const getters = {
  privilege: state => ({
    PrimaryUser: 1,
    Teacher: 2,
    Root: 3
  }),
  status: state => ({
    Reserve: 0,
    Available: 2
  }),
  encrypt: state => ({
    Public: 1,
    Private: 2,
    Password: 3
  }),
  judge: state => ({
    Pending: 0,
    Running: 1,
    CompileError: 2,
    Accepted: 3,
    RuntimeError: 4,
    WrongAnswer: 5,
    TimeLimitExceeded: 6,
    MemoryLimitExceed: 7,
    OutputLimitExceed: 8,
    PresentationError: 9,
    SystemError: 10,
    RejudgePending: 11
  }),
  currentTime: state => state.currentTime,
  website: state => state.website
}

const mutations = {
  [types.SET_SERVERTIME]: (state, payload) => {
    state.currentTime = payload.serverTime
  },
  [types.UPDATE_SERVERTIME]: (state, payload) => {
    state.currentTime += payload.step
  },
  [types.SET_WEBSITE_CONFIG]: (state, payload) => {
    state.website = payload.website
  }
}

const actions = {
  changeDomTitle ({ commit, rootState }, payload) {
    if (payload && payload.title) {
      window.document.title = payload.title
    } else {
      window.document.title = rootState.route.meta.title
    }
    window.document.title += ` | ${rootState.website.title}`
  },
  fetchTime ({ commit }) {
    return api.getTime().then(({ data }) => {
      commit(types.SET_SERVERTIME, data)
    })
  },
  updateTime ({ commit }, payload) {
    setInterval(() => {
      commit(types.UPDATE_SERVERTIME, {
        step: 1000
      })
    }, 1000)
  },
  fetchWebsiteConfig ({ commit }) {
    return api.getWebsiteConfig().then(({ data }) => {
      commit(types.SET_WEBSITE_CONFIG, data)
    })
  }
}

export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions,
  modules: {
    // session,
    // problem,
    // news,
    // solution,
    // user,
    // statistics,
    // ranklist,
    // contest,
    // group,
    // testcase,
    discuss,
    tag
  }
})
