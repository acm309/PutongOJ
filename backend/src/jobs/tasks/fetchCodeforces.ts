import superagent from 'superagent'
import redis from '../../config/redis'
import logger from '../../utils/logger'

interface CodeforcesUserInfo {
  handle: string
  email?: string
  vkId?: string
  openId?: string
  firstName?: string
  lastName?: string
  country?: string
  city?: string
  organization?: string
  contribution: number
  rank: string
  rating: number
  maxRank: string
  maxRating: number
  lastOnlineTimeSeconds: number
  registrationTimeSeconds: number
  friendOfCount: number
  avatar: string
  titlePhoto: string
}

type CodeforcesUserInfoResponse = {
  status: 'OK'
  result: CodeforcesUserInfo[]
} | {
  status: 'FAILED'
  comment: string
}

const CODEFORCES_TIMEOUT = 15000

async function fetchCodeforcesUserInfo (handles: string[]) {
  const url = new URL('https://codeforces.com/api/user.info')

  url.searchParams.set('handles', handles.join(';'))
  url.searchParams.set('checkHistoricHandles', 'false')

  const res = await superagent
    .get(url.toString())
    .timeout(CODEFORCES_TIMEOUT)
  if (res.status !== 200) {
    throw new Error(`Codeforces API returned status ${res.status}`)
  }
  const data = res.body as CodeforcesUserInfoResponse
  if (data.status === 'FAILED') {
    throw new Error(`Codeforces API error: ${res.body.comment || 'unknown error'}`)
  }

  await Promise.all(data.result.map(user => redis.set(
    `user:codeforces:info:${user.handle}`,
    JSON.stringify({ ...user, fetchedAt: Date.now() }),
  )))
  logger.info(`Fetched Codeforces info for handles: ${handles.join(', ')}`)
}

async function fetchCodeforces (item: string) {
  const type = item.slice(0, item.indexOf(':'))
  const id = item.slice(item.indexOf(':') + 1)

  switch (type) {
    case 'userInfo':
      await fetchCodeforcesUserInfo(id.split(','))
      break
    default:
      logger.warn(`Unknown Codeforces fetch type <${type}>`)
  }
}

export default fetchCodeforces
