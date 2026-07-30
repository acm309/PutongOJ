import type { UserPrivilege } from '@putongoj/shared'
import { deploy } from '../../src/utils/constants'

export interface UserSeed {
  username: string
  nickname?: string
  privilege?: UserPrivilege
  pwd?: string
}

export const userSeeds: Record<string, UserSeed> = {
  admin: { username: 'admin', nickname: 'admin', privilege: 'ROOT', pwd: deploy.adminInitPwd },
  toelevate: { username: 'toelevate', pwd: 'toelevate' },
  primaryuser: { username: 'primaryuser', nickname: 'user', pwd: 'testtest' },
  banned: { username: 'banned', pwd: ')zD1d_mh)7', privilege: 'BANNED' },
  kevin63: { username: 'kevin63', pwd: '^I^+6XYfGV' },
  ugordon: { username: 'ugordon', nickname: 'UGORDON', pwd: 'BwcTvXC%&8' },
  legacySubmitter: { username: 'legacysubmitter', pwd: 'legacySubmitter' },
  MauthnBanned: { username: 'MauthnBanned', pwd: 'Mauthn3anned', privilege: 'BANNED' },
  MauthnNormal: { username: 'MauthnNormal', pwd: 'MauthnNorma1', privilege: 'USER' },
  MauthnAdmin: { username: 'MauthnAdmin', pwd: 'Mauthn4dmin', privilege: 'ADMIN' },
  MauthnRoot: { username: 'MauthnRoot', pwd: 'Mauthn5oot', privilege: 'ROOT' },
  ScourseCstu: { username: 'ScourseCstu', pwd: '5courseCstu', privilege: 'USER' },
}
