import axios from 'axios'

const host = 'http://localhost:3000'

const state = {
  newsList: []
}

const getters = {
  newsList: (state) => {
    return state.newsList
  }
}

const mutations = {
  updateNewsList (state, payload) {
    state.newsList = payload.newsList
  }
}

const actions = {
  fetchNewsList ({commit}, payload) {
    return axios.get(host + '/api/news')
      .then(({data}) => {
        commit('updateNewsList', {
          newsList: data.news
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
