# Putong OJ Judger

Standalone submission judging service. It consumes submission IDs from the
Redis queue, loads submissions and problems from MongoDB, compiles and runs
code through the go-judge sandbox, and publishes result notifications.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `PTOJ_MONGODB_URL` | `mongodb://localhost:27017/oj` | MongoDB connection URL |
| `PTOJ_REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `PTOJ_SANDBOX_ENDPOINT` | `http://localhost:5050` | go-judge endpoint |
| `PTOJ_DATA_DIR` | `apps/server/data` | Directory containing testcase metadata and files |
| `PTOJ_SANDBOX_DATA_DIR` | `/app/data` | Testcase directory as seen by the sandbox |
| `PTOJ_LOG_LEVEL` | `info` | Pino log level |

## Commands

```bash
pnpm --filter @putong-oj/judger dev
pnpm --filter @putong-oj/judger build
pnpm --filter @putong-oj/judger start
pnpm --filter @putong-oj/judger test:unit
pnpm --filter @putong-oj/judger test:integration
```

Integration tests require MongoDB on port `27017`, Redis on port `6379`, and
the sandbox on port `5050`.
