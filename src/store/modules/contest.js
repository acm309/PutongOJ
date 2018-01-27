import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    list: [],
    sum: 0,
    contest: {},
    overview: [],
    totalProblems: 0,
    problems: [],
    ranklist: [],
    solved: []
  },
  getters: {
    list: state => state.list,
    sum: state => state.sum,
    contest: state => state.contest,
    overview: state => state.overview,
    totalProblems: state => state.totalProblems,
    problems: state => state.contest.list,
    ranklist: state => state.ranklist,
    solved: state => state.solved
  },
  mutations: {
    [types.UPDATE_CONTEST_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.UPDATE_SUM_CONTEST]: (state, payload) => {
      state.sum = payload
    },
    [types.GET_CONTEST]: (state, payload) => {
      state.contest = payload
    },
    [types.GET_CONTEST_OVERVIEW]: (state, payload) => {
      state.overview = payload
    },
    [types.GET_CONTEST_SOLVED]: (state, payload) => {
      state.solved = payload
    },
    [types.GET_CONTEST_TOTAL_PRO]: (state, payload) => {
      state.totalProblems = payload
    },
    [types.GET_CONTEST_RANK]: (state, payload) => {
      state.ranklist = payload
    },
    [types.DELETE_CONTEST]: (state, { cid }) => {
      state.list = state.list.filter((p) => p.cid !== +cid)
    }
  },
  actions: {
    find ({ commit }, payload) {
      return api.contest.find(payload).then(({ data }) => {
        commit(types.UPDATE_CONTEST_LIST, data.list.docs)
        commit(types.UPDATE_SUM_CONTEST, data.list.total)
      })
    },
    findOne ({ commit }, payload) {
      return api.contest.findOne(payload).then(({ data }) => {
        commit(types.GET_CONTEST, data.contest)
        commit(types.GET_CONTEST_OVERVIEW, data.overview)
        commit(types.GET_CONTEST_TOTAL_PRO, data.totalProblems)
        commit(types.GET_CONTEST_SOLVED, data.solved)
        return data
      })
    },
    getRank ({ commit, getters }, payload) {
      return api.contest.rank(payload).then(({ data }) => {
        const ranklist = normalize(data.ranklist, getters.contest)
        commit(types.GET_CONTEST_RANK, ranklist)
      })
    },
    create ({ commit }, payload) {
      return api.contest.create(payload).then(({ data }) => data.cid)
    },
    update ({ commit }, payload) {
      return api.contest.update(payload).then(({ data }) => data.cid)
    },
    delete ({ commit }, payload) {
      return api.contest.delete(payload).then(() => {
        commit(types.DELETE_CONTEST, payload)
      })
    },
    verify ({ commit }, payload) {
      return api.contest.verify(payload).then(({ data }) => data.isVerify)
    }
  }
}

function normalize (ranklist, contest) {
  const list = Object.values(ranklist).map(row => { // 每一行，也就是每一个用户的成绩
    let solved = 0 // 记录 ac 几道题
    let penalty = 0 // 罚时，尽在 ac 时计算
    for (const pid of contest.list) {
      if (row[pid] == null) continue // 这道题没有交过
      const submission = row[pid]
      if (submission.wa >= 0) { // ac 了
        solved++
        penalty += submission.create - contest.start + submission.wa * 20 * 60 * 1000
      }
    }
    row.solved = solved
    row.penalty = penalty
    return row
  })

  // 排序, 先按照 solved, 在按照 penalty
  list.sort((x, y) => {
    if (x.solved !== y.solved) {
      return -(x.solved - y.solved)
    }
    return x.penalty - y.penalty
  })

  // 接下来计算 primes
  const quickest = {} // 每到题最早提交的 ac 时间
  for (const pid of contest.list) {
    quickest[pid] = Infinity // init
  }
  list.forEach(row => {
    for (const pid of contest.list) {
      if (row[pid] != null && row[pid].wa >= 0) {
        quickest[pid] = Math.min(quickest[pid], row[pid].create)
      }
    }
  })
  list.forEach(row => {
    for (const pid of contest.list) {
      if (row[pid] == null || row[pid].wa < 0) continue
      if (quickest[pid] === row[pid].create) { // 这就是最早提交的那个
        row[pid].prime = true // 打上标记
      }
    }
  })
  return list
}

export default store
