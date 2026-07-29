import { env } from 'node:process'
import { defineConfig } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env.DATABASE_URL ?? 'postgresql://putong_oj:putong_oj@localhost:5432/putong_oj',
  },
})
