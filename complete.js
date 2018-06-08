const Solution = require('./models/Solution')
// const config = require('../config')
require('./config/db')

async function main () {
  console.log('start')
  const pid = 3335
  const ac = await Solution
    .find({pid, judge: 3})
    .distinct('uid')
    .exec()
    .catch((e) => console.log(e))
  console.log(ac)
  console.log(ac.length)
}

main()
  .then(() => {
    console.log('ok')
  })
  .catch((e) => {
    console.log(e)
  })
