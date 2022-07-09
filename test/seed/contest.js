const config = require('../../config')

module.exports = {
  size: 3,
  data: [
    {
      title: '第十三届中国计量大学程序设计竞赛',
      encrypt: config.encrypt.Public,
      argument: null,
      start: 1458968400000,
      end: 1458986400000,
      status: config.status.Available,
      create: 1458924613000,
      list: [
        1001
      ],
      ranklist: {
      }
    },
    {
      title: 'Private Contest',
      encrypt: config.encrypt.Private,
      argument: 'admin\r\nprimaryuser',
      start: 1468968400000,
      end: 1468986400000,
      status: config.status.Available,
      create: 1468924613000,
      list: [
        1001
      ],
      ranklist: {
      }
    },
    {
      title: 'Password Contest',
      encrypt: config.encrypt.Password,
      argument: '123456',
      start: 1468968400000,
      end: 1468986400000,
      status: config.status.Available,
      create: 1468924613000,
      list: [
        1001
      ],
      ranklist: {
      }
    },
    {
      title: 'Private Contest',
      encrypt: config.encrypt.Private,
      argument: 'admin',
      start: 1468968400000,
      end: 1468986400000,
      status: config.status.Available,
      create: 1468924613000,
      list: [
        1001
      ],
      ranklist: {
      }
    },
    {
      title: 'Future Contest',
      encrypt: config.encrypt.Public,
      argument: null,
      start: 2458968400000,
      end: 2458986400000,
      status: config.status.Available,
      create: 2458924613000,
      list: [
        1003
      ],
      ranklist: {
      }
    },
    {
      title: 'Private Group Contest',
      encrypt: config.encrypt.Private,
      argument: 'gid:1',
      start: 1468968400000,
      end: 1468986400000,
      status: config.status.Available,
      create: 2458924613000,
      list: [
        1003
      ],
      ranklist: {
      }
    },
    {
      title: 'Private Group Contest 2',
      encrypt: config.encrypt.Private,
      argument: 'gid:100', // no such group
      start: 1468968400000,
      end: 1468986400000,
      status: config.status.Available,
      create: 2458924613000,
      list: [
        1003
      ],
      ranklist: {
      }
    }
  ]
}
