import { contestLabelingStyle } from '@backend/utils/constants'
import { JudgeStatus, UserPrivilege } from '@putongoj/shared'
import { format } from 'date-fns/format'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { enUS, zhCN } from 'date-fns/locale'
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

export function formatRelativeTime (date: string | number | Date, locale: string): string {
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: locale === 'zh-CN' ? zhCN : enUS,
  })
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

export function getPrivilegeLabel (privilege: any) {
  switch (privilege) {
    case UserPrivilege.Root:
      return 'Root'
    case UserPrivilege.Admin:
      return 'Admin'
    case UserPrivilege.User:
      return 'User'
    case UserPrivilege.Banned:
      return 'Banned'
    default:
      return 'Unknown'
  }
}

export function getPrivilegeSeverity (privilege: any) {
  switch (privilege) {
    case UserPrivilege.Root:
      return 'warn'
    case UserPrivilege.Admin:
      return 'success'
    case UserPrivilege.User:
      return 'primary'
    case UserPrivilege.Banned:
      return 'danger'
    default:
      return 'contrast'
  }
}

export function calculatePercentage (num: number, den: number): string {
  if (den === 0) return '0.00%'
  const percentage = (num / den) * 100
  return `${percentage.toFixed(2)}%`
}

export function thousandSeparator (num: number | string): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function getJudgeStatusClassname (judgeStatus: JudgeStatus) {
  switch (judgeStatus) {
    case JudgeStatus.Accepted:
      return 'text-red-500'
    case JudgeStatus.WrongAnswer:
    case JudgeStatus.RuntimeError:
    case JudgeStatus.TimeLimitExceeded:
    case JudgeStatus.MemoryLimitExceeded:
    case JudgeStatus.OutputLimitExceeded:
    case JudgeStatus.SystemError:
      return 'text-green-500'
    case JudgeStatus.CompileError:
      return 'text-violet-600'
    case JudgeStatus.PresentationError:
      return 'text-yellow-500'
    default:
      return ''
  }
}

export function getSimilarityClassname (similarity: number) {
  if (similarity >= 95) return 'text-red-500 bg-red-400/20'
  if (similarity >= 90) return 'text-orange-500 bg-orange-400/20'
  if (similarity >= 85) return 'text-yellow-500 bg-yellow-400/20'
  return 'text-amber-500 bg-amber-400/20'
}
