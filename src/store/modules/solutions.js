import axios from 'axios'

const state = {
  solutionsList: [],
  solutionsPagination: {},
  solution: {},
  solutionModalActive: false,
  sid: null,
  sim_s_id: null,
  solutionSimActive: false
}

const getters = {
  solutionsList: (state) => state.solutionsList,
  solutionsPagination: (state) => state.solutionsPagination,
  solution: (state) => state.solution,
  solutionModalActive: (state) => state.solutionModalActive,
  sid: (state) => state.sid,
  sim_s_id: (state) => state.sim_s_id,
  solutionSimActive: (state) => state.solutionSimActive
}

const mutations = {
  updateSolutionsList (state, payload) {
    state.solutionsList = payload.solutionsList
  },
  updateSolutionsPagination (state, payload) {
    state.solutionsPagination = payload.solutionsPagination
  },
  updateSolution (state, payload) {
    state.solution = payload.solution
  },
  showSolutionModal (state, payload) {
    state.solutionModalActive = true
    state.sid = payload.sid
  },
  closeSolutionModal (state, payload) {
    state.solutionModalActive = false
  },
  showSim (state, payload) {
    state.solutionSimActive = true
    state.sid = payload.sid
    state.sim_s_id = payload.sim_s_id
  },
  closeSim (state, payload) {
    state.solutionSimActive = false
  }
}

const actions = {
  fetchSolutionsList ({commit}, payload) {
    return axios.get('/status', { params: payload })
      .then(({data}) => {
        commit('updateSolutionsList', {
          solutionsList: data.solutions
        })
        commit('updateSolutionsPagination', {
          solutionsPagination: data.pagination
        })
      })
  },
  fetchSolution ({commit}, payload) {
    return axios.get(`/status/${payload.sid}`)
      .then(({data}) => {
        commit('updateSolution', data)
        return data.solution
      })
  },
  submitSolution ({commit}, payload) {
    return axios.post('/status', payload)
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
