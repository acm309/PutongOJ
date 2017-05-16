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
  },
  updateOneNewsInList (state, payload) {
    const news = payload.news
    for (let i = 0; i < state.newsList.length; i += 1) {
      if (state.newsList[i].nid === news.nid) {
        state.newsList.splice(i, 1, news)
        // state.newsList[i] = news // This is a common gotcha
        return
      }
    }
  },
  deleteOneNewsInList (state, payload) {
    const news = payload.news
    for (let i = 0; i < state.newsList.length; i += 1) {
      if (state.newsList[i].nid === news.nid) {
        state.newsList.splice(i, 1)
        // state.newsList[i] = news // This is a common gotcha
        return
      }
    }
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
  },
  updateNews ({commit}, payload) {
    return axios.put(`/news/${payload.nid}`, payload)
      .then(({data}) => {
        if (data.error) {
          throw new Error(data.error)
        }
        if (payload.updateList) {
          commit('updateOneNewsInList', data)
        } else {
          commit('updateNews', data)
        }
      })
  },
  deleteNews ({commit}, payload) {
    return axios.delete(`/news/${payload.nid}`)
      .then(({data}) => {
        commit('deleteOneNewsInList', {
          news: {nid: payload.nid}
        })
      })
  },
  createNews ({commit}, payload) {
    return axios.post('/news', payload)
      .then(({data}) => {
        if (data.error) {
          throw new Error(data.error)
        }
        commit('updateNews', data)
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
