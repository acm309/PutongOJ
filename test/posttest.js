require('../config/db')
const User = require('../models/User')

async function main () {
  await User.remove({}).exec()
}

main()
  .then(() => {
    process.exit(0)
  })
