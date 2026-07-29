import constants from '../../src/utils/constants'

const { encrypt, status } = constants

const contestSeeds = [
  {
    title: '第十三届中国计量大学程序设计竞赛',
    encrypt: encrypt.Public,
    argument: null,
    start: 1458968400000,
    end: 1458986400000,
    status: status.Available,
    create: 1458924613000,
    list: [
      1001,
    ],
  }, {
    title: 'Private Contest',
    encrypt: encrypt.Private,
    argument: 'admin\r\nprimaryuser',
    start: 1468968400000,
    end: 1468986400000,
    status: status.Available,
    create: 1468924613000,
    list: [
      1001,
    ],
  }, {
    title: 'Password Contest',
    encrypt: encrypt.Password,
    argument: '123456',
    start: 1468968400000,
    end: 1468986400000,
    status: status.Available,
    create: 1468924613000,
    list: [
      1001,
    ],
  }, {
    title: 'Private Contest',
    encrypt: encrypt.Private,
    argument: 'admin',
    start: 1468968400000,
    end: 1468986400000,
    status: status.Available,
    create: 1468924613000,
    list: [
      1001,
    ],
  }, {
    title: 'Future Contest',
    encrypt: encrypt.Public,
    argument: null,
    start: 2458968400000,
    end: 2458986400000,
    status: status.Available,
    create: 2458924613000,
    list: [
      1003,
    ],
  }, {
    title: 'Private Group Contest',
    encrypt: encrypt.Private,
    argument: 'gid:1',
    start: 1468968400000,
    end: 1468986400000,
    status: status.Available,
    create: 2458924613000,
    list: [
      1003,
    ],
  }, {
    title: 'Private Group Contest 2',
    encrypt: encrypt.Private,
    argument: 'gid:100', // no such group
    start: 1468968400000,
    end: 1468986400000,
    status: status.Available,
    create: 2458924613000,
    list: [
      1003,
    ],
  },
]

export { contestSeeds }
