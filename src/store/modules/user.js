import axios from 'axios'
import queryString from 'query-string'

const state = {
  user: {},
  solved: [],
  unsolved: [],
  usersList: []
}

const getters = {
  user: (state) => state.user,
  solved: (state) => state.solved,
  unsolved: (state) => state.unsolved,
  usersList: (state) => state.usersList
}

const mutations = {
  updateUser (state, payload) {
    state.user = payload.user
  },
  updateSolved (state, payload) {
    state.solved = payload.solved
  },
  updateUnsolved (state, payload) {
    state.unsolved = payload.unsolved
  },
  updateUsersList (state, payload) {
    state.usersList = payload.usersList
  },
  updateOneUserInList (state, payload) {
    const user = payload.user
    for (let i = 0; i < state.usersList.length; i += 1) {
      if (state.usersList[i].uid === user.uid) {
        state.usersList.splice(i, 1, user)
      }
    }
  }
}

const actions = {
  fetchUser ({commit}, payload) {
    return axios.get(`/users/${payload.uid}`)
      .then(({data}) => {
        commit('updateUser', data)
        commit('updateSolved', data)
        commit('updateUnsolved', data)
      })
  },
  register ({commit}, payload) {
    return axios.post('/users', payload)
      .then(({data}) => {
        if (data.error) {
          throw new Error(data.error)
        }
        commit('updateSelf', { // session module
          self: data.user
        })
      })
  },
  updateUser ({commit}, payload) {
    return axios.put(`/users/${payload.uid}`, payload)
      .then(({data}) => {
        if (data.error) {
          throw new Error(data.error)
        }
        if (payload.updateList) {
          commit('updateOneUserInList', data)
        } else {
          commit('updateUser', {
            user: data.user
          })
        }
      })
  },
  fetchUsersList ({commit}, payload) {
    return axios.get('/users?' + queryString.stringify(payload))
      .then(({data}) => {
        commit('updateUsersList', {
          usersList: data.users
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
