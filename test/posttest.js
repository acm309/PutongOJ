require('dotenv-flow').config()
require('../config/db')
const { removeall } = require('./helper')

async function main () {
  return removeall()
}

main()
  .then(() => {
    process.exit(0)
  })
