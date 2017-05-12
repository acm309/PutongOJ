import axios from 'axios'
import queryString from 'query-string'

const state = {
  contestsList: [],
  contest: null,
  contestOverview: [],
  contestRanklist: [],
  contestDefaultPid: 0
}

const getters = {
  contestsList: (state) => state.contestsList,
  contest: (state) => state.contest,
  contestOverview: (state) => state.contestOverview,
  contestRanklist: (state) => state.contestRanklist,
  contestDefaultPid: (state) => state.contestDefaultPid
}

const mutations = {
  updateContestsList (state, payload) {
    state.contestsList = payload.contestsList
  },
  updateContest (state, payload) {
    state.contest = payload.contest
  },
  updateContestOverview (state, payload) {
    state.contestOverview = payload.contestOverview
  },
  updateContestDefaultPid (state, payload) {
    state.contestDefaultPid = payload.pid
  },
  updateContestRanklist (state, payload) {
    let ranklist = payload.contestRanklist
    ranklist.sort((x, y) => {
      if (x.solve !== y.solve) {
        return x.solve > y.solve ? -1 : 1
      }
      return x.penalty > y.penalty ? 1 : -1
    })
    // 挑选每到题最早的提交时间，从而选出每题第一个提交
    let fatest = {}
    for (let pid in state.contest.list) {
      fatest[pid] = Infinity
    }
    for (let rank of ranklist) {
      for (let pid in rank.solved) {
        let sol = rank.solved[pid]
        if (sol.wa >= 0) {
          fatest[pid] = fatest[pid] < sol.create ? fatest[pid] : sol.create
        }
      }
    }
    for (let rank of ranklist) {
      for (let pid in rank.solved) {
        let sol = rank.solved[pid]
        if (sol.wa >= 0 && fatest[pid] === sol.create) {
          sol.isFirst = true
        }
      }
    }
    state.contestRanklist = ranklist
  },
  deleteOneContestInList (state, payload) {
    const contest = payload.contest
    for (let i = 0; i < state.contestsList.length; i += 1) {
      if (state.contestsList[i].cid === contest.cid) {
        state.contestsList.splice(i, 1)
        return
      }
    }
  },
  updateOneContestInList (state, payload) {
    const contest = payload.contest
    for (let i = 0; i < state.contestsList.length; i += 1) {
      if (state.contestsList[i].cid === contest.cid) {
        state.contestsList.splice(i, 1, contest)
      }
    }
  }
}

const actions = {
  fetchContestsList ({commit}, payload) {
    return axios.get('/contests?' + queryString.stringify(payload))
      .then(({data}) => {
        commit('updateContestsList', {
          contestsList: data.contests
        })
      })
  },
  fetchContest ({commit}, payload) {
    return axios.get(`/contests/${payload.cid}`)
      .then(({data}) => {
        commit('updateContest', data)
      })
  },
  fetchContestOverview ({commit}, payload) {
    return axios.get(`/contests/${payload.cid}/overview`)
      .then(({data}) => {
        commit('updateContestOverview', {
          contestOverview: data.overview
        })
      })
  },
  fetchContestRanklist ({commit}, payload) {
    return axios.get(`/contests/${payload.cid}/ranklist`)
      .then(({data}) => {
        commit('updateContestRanklist', {
          contestRanklist: data.ranklist
        })
      })
  },
  deleteContest ({commit}, payload) {
    return axios.delete(`/contests/${payload.cid}`)
      .then(({data}) => {
        commit('deleteOneContestInList', {
          contest: { cid: payload.cid }
        })
      })
  },
  updateContest ({commit}, payload) {
    return axios.put(`/contests/${payload.cid}`, payload)
      .then(({data}) => {
        if (payload.updateList) {
          commit('updateOneContestInList', data)
        }
      })
  },
  createContest ({commit}, payload) {
    return axios.post('/contests', payload)
      .then(({data}) => {
        commit('updateContest', data)
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
