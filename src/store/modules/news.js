import axios from 'axios'

const state = {
  newsList: [],
  newsPagination: {},
  news: []
}

const getters = {
  newsList: (state) => state.newsList,
  newsPagination: (state) => state.newsPagination,
  news: (state) => state.news
}

const mutations = {
  updateNewsList (state, payload) {
    state.newsList = payload.newsList
  },
  updateNewsPagination (state, payload) {
    state.newsPagination = payload.newsPagination
  },
  updateNews (state, payload) {
    state.news = payload.news
  }
}

const actions = {
  fetchNewsList ({commit}, payload) {
    return axios.get('/news')
      .then(({data}) => {
        commit('updateNewsList', {
          newsList: data.news
        })
        commit('updateNewsPagination', {
          newsPagination: data.pagination
        })
      })
  },
  fetchNews ({commit}, payload) {
    return axios.get(`/news/${payload.nid}`)
      .then(({data}) => {
        commit('updateNews', {
          news: data.news
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
