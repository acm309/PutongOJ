# Putong OJ Judger

TypeScript replacement for the original Python `ptoj-judger`. It keeps the
original judging behavior while using the pinned `go-judge` sandbox for code
execution.

## Responsibilities

- Consume submission ObjectIds from `judger:task`.
- Load submissions and problems from MongoDB by `_id`.
- Compile and run C, C++11, C++17, Java, Python, and PyPy submissions.
- Judge traditional, Special Judge, and interactive problems.
- Save running and final results to MongoDB.
- Publish solution ObjectIds to `judger:result` after saving results.

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
| `PTOJ_LOG_FILE` | `judger.log` | Log file path |
| `PTOJ_DEBUG` | `1` | Enable debug logging |

## Local Development

Start Redis, go-judge, and the worker:

```bash
docker compose up --build
```

Or run the worker directly against local services:

```bash
pnpm --filter @putong-oj/judger dev
```

## Tests

Unit tests do not require external services:

```bash
pnpm --filter @putong-oj/judger test:unit
```

Integration tests require MongoDB on port `27017`, Redis on port `6379`, and
the sandbox on port `5050`:

```bash
docker compose up -d db redis sandbox
pnpm --filter @putong-oj/judger test:integration
```
