import axios from 'axios'

const host = 'http://localhost:3000'

const state = {
  news: []
}

const getters = {
  news: (state) => {
    return state.news
  }
}

const mutations = {
  updateNews (state, payload) {
    state.news = payload.news
  }
}

const actions = {
  fetchNews ({commit}, payload) {
    return axios.get(host + `/api/news/${payload.nid}`)
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
