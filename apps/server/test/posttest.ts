import process from 'node:process'
import { removeall } from './helper'

async function main () {
  await removeall()
  const { createDatabaseClient } = await import('@putongoj/db')
  const database = createDatabaseClient(process.env.DATABASE_URL!)
  await database.post.deleteMany()
  await database.$disconnect()
}

main()
  .then(() => {
    process.exit(0)
  })
