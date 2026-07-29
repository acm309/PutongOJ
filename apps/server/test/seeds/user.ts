import type { UserDocument } from '../../src/models/User'
import { UserPrivilege } from '@putongoj/shared'
import { deploy } from '../../src/utils/constants'

type UserSeed = Partial<Omit<UserDocument, 'pwd'>> & { pwd?: string }

const userSeeds: Record<string, UserSeed> = {
  admin: {
    uid: 'admin',
    nick: 'admin',
    privilege: UserPrivilege.Root,
    pwd: deploy.adminInitPwd,
  },
  toelevate: {
    uid: 'toelevate',
    pwd: 'toelevate',
  },
  primaryuser: {
    uid: 'primaryuser',
    nick: 'user',
    pwd: 'testtest',
  },
  banned: {
    uid: 'banned',
    pwd: ')zD1d_mh)7',
    privilege: UserPrivilege.Banned,
  },
  kevin63: {
    uid: 'kevin63',
    pwd: '^I^+6XYfGV',
  },
  ugordon: {
    uid: 'ugordon',
    nick: 'UGORDON',
    pwd: 'BwcTvXC%&8',
  },
  MauthnBanned: {
    uid: 'MauthnBanned',
    pwd: 'Mauthn3anned',
    privilege: UserPrivilege.Banned,
  },
  MauthnNormal: {
    uid: 'MauthnNormal',
    pwd: 'MauthnNorma1',
    privilege: UserPrivilege.User,
  },
  MauthnAdmin: {
    uid: 'MauthnAdmin',
    pwd: 'Mauthn4dmin',
    privilege: UserPrivilege.Admin,
  },
  MauthnRoot: {
    uid: 'MauthnRoot',
    pwd: 'Mauthn5oot',
    privilege: UserPrivilege.Root,
  },
  ScourseCstu: {
    uid: 'ScourseCstu',
    pwd: '5courseCstu',
    privilege: UserPrivilege.User,
  },
}

export { userSeeds }
