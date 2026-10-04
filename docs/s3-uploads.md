# S3 uploads: local development and behavior

This stage adds optional S3 storage for editor uploads. Testcases, judge caches,
compiler output and submission output still use their existing paths.

## Request flow

```text
POST /api/upload
  -> temporary multipart file -> quota check -> storage PUT -> MongoDB Files row

GET or HEAD /uploads/<storageKey>
  -> reject deleted records -> configured storage -> stream bytes to browser

DELETE /api/files/<storageKey>
  -> existing authorization -> storage DELETE -> MongoDB deletion marker
```

`Files.storageKey`, ownership, quota accounting and API responses remain unchanged.
The default driver is `local`. S3 objects use `uploads/<storageKey>` by default;
the browser still requests `/uploads/<storageKey>` from the OJ server. The bucket
can stay private: the server makes authenticated S3 requests on its behalf.

## Configuration

Set these variables at the repository root in an ignored `.env.local`, or inject
them through the deployment environment. The server and worker must use the same
`PTOJ_UPLOAD_STORAGE` value.

| Variable | Meaning / default |
| --- | --- |
| `PTOJ_UPLOAD_STORAGE` | `local` (default) or `s3`; other values fail startup |
| `PTOJ_UPLOAD_DIR` | Local directory, relative to repository root or absolute |
| `PTOJ_S3_ENDPOINT` | Required S3 API endpoint, **not** the web console |
| `PTOJ_S3_REGION` | `us-east-1` |
| `PTOJ_S3_BUCKET` | Required existing bucket; the application does not create it |
| `PTOJ_S3_UPLOAD_PREFIX` | `uploads` |
| `PTOJ_S3_ACCESS_KEY_ID` | Required application access key |
| `PTOJ_S3_SECRET_ACCESS_KEY` | Required application secret key |
| `PTOJ_S3_FORCE_PATH_STYLE` | `true` by default; only `true` / `false` accepted |

The application needs GetObject, PutObject and DeleteObject for its upload prefix,
plus HeadBucket access (S3 `ListBucket` permission) to distinguish a missing object
from a missing/misconfigured bucket on HEAD requests. It does not need public
bucket access or bucket creation privileges. Use an application account in production.

## Isolated local services

Run commands in Linux / WSL2 with Node >= 24, pnpm >= 11 and Docker Compose.
The repository pins pnpm 11.17.0. Install Linux dependencies separately from any
Windows installation of `node_modules`.

When the source stays on a Windows drive mounted under `/mnt`, put the dependency
store and virtual store on the Linux filesystem to reduce small-file I/O. Keep a
separate virtual store for each worktree; the content store can be shared:

```bash
pnpm install --frozen-lockfile \
  --store-dir "$HOME/.local/share/putong-oj/store" \
  --virtual-store-dir "$HOME/.local/share/putong-oj/s3-uploads/virtual-store"
```

Use these same options for subsequent dependency installs in that worktree.

`docker-compose.s3.yml` is a separate development stack with named volumes and
loopback bindings:

| Service | Host endpoint |
| --- | --- |
| Silo API | `http://127.0.0.1:19000` |
| Silo console | `http://127.0.0.1:19001` |
| MongoDB | `mongodb://127.0.0.1:27028/oj_s3_dev` |
| Redis | `redis://127.0.0.1:6388/0` |

The [official Silo image](https://silo.pgsty.com/download/) is pinned to
`RELEASE.2026-09-16T00-00-00Z`. Set `PTOJ_DEV_S3_ROOT_USER` and
`PTOJ_DEV_S3_ROOT_PASSWORD` in `.env.local` before starting the stack. Create
private `putong-oj-dev` and `putong-oj-test` buckets using an administrator, and
configure the application's S3 keys. A local administrator key is acceptable for
an isolated development fixture; production requires a separate application key.

```bash
pnpm install --frozen-lockfile
docker compose --env-file .env.local -f docker-compose.s3.yml up -d --wait
pnpm build
pnpm --filter @putong-oj/server dev
```

Set the development MongoDB / Redis URLs to the endpoints above. Leave the
original Compose stack separate. `docker compose ... down` preserves named
volumes; `down -v` removes them and is unnecessary for normal restarts.

## Tests

The existing server pretest/posttest hooks delete all records and flush the
selected Redis database. Configure **only disposable, isolated** endpoints in
an ignored `.env.test.local`:

```dotenv
PTOJ_MONGODB_URL=mongodb://127.0.0.1:27028/oj_s3_test
PTOJ_REDIS_URL=redis://127.0.0.1:6388/15
PTOJ_UPLOAD_STORAGE=local
PTOJ_UPLOAD_DIR=.dev/uploads-test
PTOJ_S3_ENDPOINT=http://127.0.0.1:19000
PTOJ_S3_BUCKET=putong-oj-test
# Set the S3 access key and secret privately, never commit this file.
```

Run the full local driver regression suite, then rerun the upload tests against
the real local Silo bucket. Shell environment variables override dotenv files.

```bash
pnpm --filter @putong-oj/server test
PTOJ_UPLOAD_STORAGE=s3 pnpm --filter @putong-oj/server pretest
PTOJ_UPLOAD_STORAGE=s3 NODE_ENV=test pnpm --filter @putong-oj/server exec ava \
  test/handlers/file/*.test.ts test/services/upload-storage.test.ts
pnpm --filter @putong-oj/server posttest
pnpm typecheck
pnpm lint
```

The tests cover byte preservation, old URLs, HEAD/304, deleted/missing objects,
legacy files without database records, overwrite refusal and partial failures.

## Failure behavior and compatibility

- PUT refuses an existing key instead of overwriting bytes.
- Uploads always clean up the request's temporary file after handling.
- A failed PUT response can hide a successful object write. No database row is
  created in that case; the key is logged for reconciliation and bytes are
  retained. Automatic retries must not overwrite or delete an existing key.
- A definite MongoDB validation/duplicate rejection triggers object cleanup only
  if no row references the key. A network error can hide a successful database
  write, so an unknown registration outcome retains the object and logs its key
  for reconciliation. This stage has no automated reconciliation job.
- A physical deletion failure returns an error and keeps the record active so
  the caller can retry. If saving the deletion marker fails after physical
  deletion, the next delete can repeat the storage operation safely.
- Deleted records return 404 even if bytes remain. Legacy keys without a Files
  row remain readable. Missing uploads never fall through to static files or SPA.
- Content-Type is detected from uploaded bytes. Recognized raster images are
  displayed; other formats (including HTML and SVG) are downloads with `nosniff`.
  This changes how such legacy non-raster files are served.
- The server upload limit is 5 MiB, matching the editor. Range requests are not
  implemented by the new upload middleware; whole-object GET/HEAD is supported.
- Upload cache lifetime preserves the current effective static setting:
  `max-age=604` seconds. The old `koa-static` option is in milliseconds despite
  its "1 week" comment; this change does not silently extend caching to a week.
- S3 configuration or service failures propagate as errors; there is no silent
  fallback to local files. Local folder scan jobs are rejected in S3 mode to
  avoid treating an old local directory as the current storage source.

## Before enabling in production

Copy and verify all existing upload bytes, keeping their storage keys and URLs,
**before** switching the driver. This branch does not migrate existing data or
change deployment configuration automatically. A scan must include historical
files without database rows and account for deleted records and files still
referenced by old content.

The migration stage still needs an inventory, resumable copy/checksum tooling,
an agreed final synchronization window, reconciliation, backup verification and
a rollback procedure that handles files uploaded after the switch. Testcases and
judge cache changes are separate work. A development branch push does not enable
S3 on a running OJ instance.
