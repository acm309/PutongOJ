import axios from 'axios'

const state = {
  discussesList: [],
  commentsList: []
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
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
