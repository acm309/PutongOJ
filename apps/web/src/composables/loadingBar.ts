import { reactive } from 'vue'

export interface LoadingBarState {
  percent: number
  show: boolean
  status: 'success' | 'error'
}

const state = reactive<LoadingBarState>({
  percent: 0,
  show: false,
  status: 'success',
})

let timer: ReturnType<typeof setInterval> | null = null

function clearTimer () {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function hide () {
  setTimeout(() => {
    state.show = false
    setTimeout(() => {
      state.percent = 0
    }, 300)
  }, 700)
}

export function useLoadingBar () {
  function start () {
    if (timer) return
    state.percent = 0
    state.status = 'success'
    state.show = true

    timer = setInterval(() => {
      state.percent += Math.floor(Math.random() * 3 + 1)
      if (state.percent > 95) {
        clearTimer()
      }
    }, 200)
  }

  function finish () {
    clearTimer()
    state.percent = 100
    state.status = 'success'
    state.show = true
    hide()
  }

  function error () {
    clearTimer()
    state.percent = 100
    state.status = 'error'
    state.show = true
    hide()
  }

  return { start, finish, error }
}

export { state as loadingBarState }
