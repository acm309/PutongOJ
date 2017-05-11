const state = {
  messages: []
}

const getters = {
  messages: (state) => state.messages
}

const mutations = {
  addMessage (state, payload) {
    state.messages.push({
      body: payload.body,
      type: payload.type || 'success'
    })
  },
  removeMessage (state, payload) {
    state.messages.shift()
  }
}

const actions = {
  addMessage ({commit}, payload) {
    commit('addMessage', payload)
    // remove
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        commit('removeMessage')
        resolve()
      }, payload.time || 3000)
    })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
