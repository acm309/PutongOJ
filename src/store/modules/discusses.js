import axios from 'axios'

const state = {
  discussesList: [],
  commentsList: [],
  discuss: null
}

const getters = {
  discussesList: (state) => state.discussesList,
  commentsList: (state) => state.commentsList,
  discuss: (state) => state.discuss
}

const mutations = {
  updateDiscussesList (state, payload) {
    state.discussesList = payload.discussesList
  },
  updateCommentsList (state, payload) {
    state.commentsList = payload.commentsList
  },
  updateDiscuss (state, payload) {
    state.discuss = payload.discuss
  }
}

const actions = {
  fetchDiscussesList ({commit}, payload) {
    return axios.get('/discusses')
      .then(({data}) => {
        commit('updateDiscussesList', {
          discussesList: data.discusses.sort((x, y) => y.update - x.update)
        })
      })
  },
  fetchCommentsList ({commit}, payload) {
    return axios.get(`/discusses/${payload.did}`)
      .then(({data}) => {
        commit('updateCommentsList', {
          commentsList: data.comments
        })
        commit('updateDiscuss', data)
      })
  },
  createDiscuss ({commit}, payload) {
    return axios.post('/discusses', payload)
      .then(({data}) => {
        if (data.error) {
          throw new Error(data.error)
        }
        commit('updateDiscuss', data)
      })
  },
  createComment ({commit}, payload) {
    return axios.post('/comments', payload)
      .then(({data}) => {
        if (data.error) {
          throw new Error(data.error)
        }
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
