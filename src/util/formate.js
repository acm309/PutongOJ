import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import toDate from 'date-fns/toDate'
import format from 'date-fns/format'

function formate (value) {
  const num = value * 100
  return `${num.toFixed(2)}%`
}

function timePretty (time) {
  return format(toDate(parseInt(time || 0)), 'yyyy-MM-dd HH:mm:ss')
}

function timeagoPretty (time) {
  return formatDistanceToNow(toDate(parseInt(time || 0)))
}

function timeContest (time) {
  const h = Math.floor(time / (1000 * 60 * 60))
  const m = Math.floor((time - h * 1000 * 60 * 60) / (1000 * 60))
  const s = Math.floor((time - h * 1000 * 60 * 60 - m * 1000 * 60) / 1000)
  const ss = `${s}`.padStart(2, '0')
  const mm = `${m}`.padStart(2, '0')
  return `${h}:${mm}:${ss}`
}

export {
  formate,
  timePretty,
  timeContest,
  timeagoPretty,
}
