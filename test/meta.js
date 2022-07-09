const config = require('../config')
const { generatePwd } = require('../utils/helper')

module.exports = {
  problems: {
    1000: {
      title: 'A + B',
      time: 200,
      memory: 65530,
      description: 'Calculate A + B',
      input: 'two integers',
      output: 'the sum',
      'in': '1 2',
      out: '3'
    }
  },
  users: {
    admin: {
      uid: 'admin',
      pwd: generatePwd(config.deploy.adminInitPwd),
      nick: 'Test',
      privilege: config.privilege.Root
    },
    pu: {
      uid: 'primaryuser',
      pwd: generatePwd('123'),
      nick: 'pu'
    }
  },
  groups: [
    {
      title: '测试组1',
      list: [
        'admin',
        'pu',
        'primaryuser'
      ]
    }
  ]
}
