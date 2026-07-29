import process from 'node:process'
import { removeall } from './helper'

async function main () {
  await removeall()
}

main()
  .then(() => {
    process.exit(0)
  })
