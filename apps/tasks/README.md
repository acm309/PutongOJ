# Putong OJ Tasks

TypeScript replacement for the original Python `ptoj-judger` and the background
jobs that previously lived under `apps/server`.

## Modules

### Judger

Entrypoint: `src/modules/judger/main.ts`

- Consume submission ObjectIds from `judger:task`.
- Load submissions and problems from MongoDB by `_id`.
- Compile and run C, C++11, C++17, Java, Python, and PyPy submissions.
- Judge traditional, Special Judge, and interactive problems.
- Save running and final results to MongoDB.
- Publish solution ObjectIds to `judger:result` after saving results.
- Consume result notifications, push WebSocket updates, and trigger statistics
  and similarity jobs.

### Worker

Entrypoint: `src/modules/worker/main.ts`

- Update user, problem, and discussion statistics.
- Check accepted solutions for similarity.
- Fetch Codeforces user information.
- Scan the uploads directory and restore missing file records.

The sandbox and Testlib checker remain C/C++ components. This service replaces
the Python control plane, not the secure execution sandbox.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `PTOJ_MONGODB_URL` | `mongodb://localhost:27017/oj` | MongoDB connection URL |
| `PTOJ_REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `PTOJ_SANDBOX_ENDPOINT` | `http://localhost:5050` | go-judge endpoint |
| `PTOJ_DATA_DIR` | `apps/server/data` | Directory containing testcase metadata and files |
| `PTOJ_SANDBOX_DATA_DIR` | `/app/data` | Testcase directory as seen by the sandbox |
| `PTOJ_UPLOAD_DIR` | `apps/server/public/uploads` | Uploads directory scanned by the worker |
| `PTOJ_LOG_FILE` | `judger.log` / `worker.log` | Log file path |
| `PTOJ_DEBUG` | `1` | Enable debug logging |

## Local Development

Start Redis, go-judge, and the worker:

```bash
docker compose up --build
```

Run both modules directly against local services:

```bash
pnpm --filter @putong-oj/tasks dev
```

They can also be started independently:

```bash
pnpm --filter @putong-oj/tasks dev:judger
pnpm --filter @putong-oj/tasks dev:worker
```

## Tests

Unit tests do not require external services:

```bash
pnpm --filter @putong-oj/tasks test:unit
```

Integration tests require MongoDB on port `27017`, Redis on port `6379`, and
the sandbox on port `5050`:

```bash
docker compose up -d db redis sandbox
pnpm --filter @putong-oj/tasks test:integration
```
