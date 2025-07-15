import type { UserDocument } from '../../src/models/User'
import constants from '../../src/utils/constants'

const { privilege, deploy } = constants

const userSeeds: Record<string, Partial<UserDocument>> = {
  admin: {
    uid: 'admin',
    nick: 'admin',
    privilege: privilege.Root,
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
    privilege: privilege.Banned,
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
    privilege: privilege.Banned,
  },
  MauthnNormal: {
    uid: 'MauthnNormal',
    pwd: 'MauthnNorma1',
    privilege: privilege.User,
  },
  MauthnAdmin: {
    uid: 'MauthnAdmin',
    pwd: 'Mauthn4dmin',
    privilege: privilege.Admin,
  },
  MauthnRoot: {
    uid: 'MauthnRoot',
    pwd: 'Mauthn5oot',
    privilege: privilege.Root,
  },
  ScourseCstu: {
    uid: 'ScourseCstu',
    pwd: '5courseCstu',
    privilege: privilege.User,
  },
}

export { userSeeds }
