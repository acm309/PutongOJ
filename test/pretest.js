require('../config/db')
const config = require('../config')
const User = require('../models/User')
const { generatePwd } = require('../utils/helper')

async function main () {
  const admin = new User({
    uid: 'admin',
    pwd: generatePwd('kplkplkpl'),
    nick: 'Test',
    privilege: config.privilege.Root
  })
  await admin.save()
}

main()
  .then(() => {
    process.exit(0)
  })
