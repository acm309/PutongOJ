import { contestLabelingStyle } from '@backend/utils/constants'
import { format } from 'date-fns/format'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { toDate } from 'date-fns/toDate'

export function formate (value: number) {
  const num = value * 100
  return `${num.toFixed(2)}%`
}

export function timePretty (
  time: Date | number | string = 0,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss',
) {
  if (typeof time === 'string' && /^\d+$/.test(time)) {
    time = Number(time)
  }
  return format(toDate(time), formatStr)
}

export function timeagoPretty (time: number | string) {
  return formatDistanceToNow(toDate(Number(time)))
}

export function timeContest (remainSeconds: number): string {
  if (remainSeconds <= 0) {
    return '00:00:00'
  }

  const hours = Math.floor(remainSeconds / (60 * 60))
  const minutes = Math.floor((remainSeconds % (60 * 60)) / 60)
  const seconds = Math.floor(remainSeconds % 60)

  const paddedHours = String(hours).padStart(2, '0')
  const paddedMinutes = String(minutes).padStart(2, '0')
  const paddedSeconds = String(seconds).padStart(2, '0')

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`
}

export function timeDiffPretty (ms: number) {
  const sign = ms > 0 ? '+' : ''
  if (ms < 1000)
    return `${sign}${ms}ms`
  else
    return `${sign}${Math.floor(ms / 1000)}.${Math.round(ms % 1000 / 100)}s`
}

export function similarityColor (val: number) {
  if (val === 100) return 'red'
  if (val >= 95) return 'volcano'
  if (val >= 90) return 'orange'
  if (val >= 85) return 'gold'
  return 'yellow'
}

export function contestLabeling (
  value: number,
  style: typeof contestLabelingStyle[keyof typeof contestLabelingStyle]
    = contestLabelingStyle.numeric,
): string {
  //
  function toAlphabetic (n: number): string {
    if (n < 1) return ''

    let result = ''
    while (n > 0) {
      n--
      const remainder = n % 26
      result = String.fromCharCode(65 + remainder) + result
      n = Math.floor(n / 26)
    }
    return result
  }

  switch (style) {
    case contestLabelingStyle.alphabetic:
      return toAlphabetic(value)

    case contestLabelingStyle.numeric:
    default:
      return String(value)
  }
}
