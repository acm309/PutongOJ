import axios from 'axios'

const state = {
  discussesList: [],
  commentsList: [],
  discuss: null
}

const getters = {
  discussesList: (state) => state.discussesList,
  commentsList: (state) => state.commentsList
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
    axios.get('/discusses')
      .then(({data}) => {
        commit('updateDiscussesList', {
          discussesList: data.discusses.sort((x, y) => x.update < y.update)
        })
      })
  },
  createDiscuss ({commit}, payload) {
    axios.post('/discusses', payload)
      .then(({data}) => {
        if (data.error) {
          throw new Error(data.error)
        }
        commit('updateDiscuss', data)
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
