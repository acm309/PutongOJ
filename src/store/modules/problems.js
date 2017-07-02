import axios from 'axios'

const state = {
  problemsList: [],
  problemsPagination: {},
  problem: {},
  problemsSolved: []
}

const getters = {
  problemsList: (state) => state.problemsList,
  problemsPagination: (state) => state.problemsPagination,
  problem: (state) => state.problem,
  problemsSolved: (state) => state.problemsSolved
}

const mutations = {
  updateProblemsList (state, payload) {
    state.problemsList = payload.problemsList
  },
  updateProblemsPagination (state, payload) {
    state.problemsPagination = payload.problemsPagination
  },
  updateProblem (state, payload) {
    state.problem = payload.problem
  },
  deleteOneProblemInList (state, payload) {
    const problem = payload.problem
    for (let i = 0; i < state.problemsList.length; i += 1) {
      if (state.problemsList[i].pid === problem.pid) {
        state.problemsList.splice(i, 1)
        return
      }
    }
  },
  updateOneProblemInList (state, payload) {
    const problem = payload.problem
    for (let i = 0; i < state.problemsList.length; i += 1) {
      if (state.problemsList[i].pid === problem.pid) {
        state.problemsList.splice(i, 1, problem)
        return
      }
    }
  },
  updateProblemsSolved (state, payload) {
    state.problemsSolved = payload.problemsSolved
  }
}

const actions = {
  fetchProblemsList ({commit}, payload) {
    return axios.get('/problems', { params: payload })
      .then(({data}) => {
        commit('updateProblemsList', {
          problemsList: data.problems
        })
        commit('updateProblemsPagination', {
          problemsPagination: data.pagination
        })
        commit('updateProblemsSolved', {
          problemsSolved: data.solved
        })
      })
  },
  fetchProblem ({commit}, payload) {
    return axios.get(`/problems/${payload.pid}`, { params: payload })
      .then(({data}) => {
        if (data.error) {
          throw new Error(data.error)
        }
        commit('updateProblem', {
          problem: data.problem
        })
        return data.problem
      })
  },
  deleteProblem ({commit}, payload) {
    return axios.delete(`/problems/${payload.pid}`)
      .then(({data}) => {
        commit('deleteOneProblemInList', {
          problem: {pid: payload.pid}
        })
      })
  },
  updateProblem ({commit}, payload) {
    return axios.put(`/problems/${payload.pid}`, payload)
      .then(({data}) => {
        if (data.error) {
          throw new Error(data.error)
        }
        if (payload.updateList) {
          commit('updateOneProblemInList', data)
        } else {
          commit('updateProblem', data)
        }
      })
  },
  createProblem ({commit}, payload) {
    return axios.post('/problems', payload)
      .then(({data}) => {
        if (data.error) {
          throw new Error(data.error)
        }
        commit('updateProblem', {
          problem: data.problem
        })
      })
  },
  uploadTestData ({commit}, payload) {
    return axios.post(`/problems/${payload.pid}/testdata`, payload.data)
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
