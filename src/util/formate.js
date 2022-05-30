import moment from 'moment'

function formate (value) {
  const num = value * 100
  return `${num.toFixed(2)}%`
}

function timePretty (time) {
  return moment(parseInt(time)).format('YYYY-MM-DD HH:mm:ss')
}

function timeagoPretty (time) {
  return moment(parseInt(time)).fromNow()
}

function timeContest (time) {
  const h = Math.floor(time / (1000 * 60 * 60))
  const m = Math.floor((time - h * 1000 * 60 * 60) / (1000 * 60))
  const s = Math.floor((time - h * 1000 * 60 * 60 - m * 1000 * 60) / 1000)
  const ss = (`0${s}`).split('').reverse().join('').substr(0, 2).split('').reverse().join('')
  const mm = (`0${m}`).split('').reverse().join('').substr(0, 2).split('').reverse().join('')
  return `${h}:${mm}:${ss}`
}

export {
  formate,
  timePretty,
  timeContest,
  timeagoPretty,
}
