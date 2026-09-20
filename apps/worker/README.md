# Putong OJ Worker

Background worker for statistics updates, solution similarity checks,
Codeforces profile synchronization, and uploads reconciliation.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `PTOJ_MONGODB_URL` | `mongodb://localhost:27017/oj` | MongoDB connection URL |
| `PTOJ_REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `PTOJ_UPLOAD_DIR` | `apps/server/public/uploads` | Uploads directory to scan |
| `PTOJ_LOG_LEVEL` | `info` | Pino log level |

## Commands

```bash
pnpm --filter @putong-oj/worker dev
pnpm --filter @putong-oj/worker build
pnpm --filter @putong-oj/worker start
```
