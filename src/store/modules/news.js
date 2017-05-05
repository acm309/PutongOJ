import axios from 'axios'

const host = 'http://localhost:3000'

const state = {
  newsList: [],
  newsPagination: {}
}

const getters = {
  newsList: (state) => {
    return state.newsList
  },
  newsPagination: (state) => {
    return state.newsPagination
  }
}

const mutations = {
  updateNewsList (state, payload) {
    state.newsList = payload.newsList
  },
  updateNewsPagination (state, payload) {
    state.newsPagination = payload.newsPagination
  }
}

const actions = {
  fetchNewsList ({commit}, payload) {
    return axios.get(host + '/api/news')
      .then(({data}) => {
        commit('updateNewsList', {
          newsList: data.news
        })
        commit('updateNewsPagination', {
          newsPagination: data.pagination
        })
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
