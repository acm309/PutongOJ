# Putong OJ WebSocket Server

Standalone WebSocket gateway for real-time notifications and submission result
updates.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `PTOJ_WS_PORT` | `3001` | WebSocket listen port |
| `PTOJ_REDIS_URL` | `redis://localhost:6379` | Redis connection URL |

## Commands

```bash
pnpm --filter @putong-oj/ws-server dev
pnpm --filter @putong-oj/ws-server build
pnpm --filter @putong-oj/ws-server start
```
