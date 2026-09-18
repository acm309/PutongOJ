# Version checker
FROM node:24-alpine AS version_checker
WORKDIR /app

RUN apk add --no-cache git

COPY .git/ .git/
RUN echo $(git rev-parse --short HEAD) > version.txt

# Base builder
FROM node:24-slim AS base_builder
WORKDIR /app

RUN npm i -g pnpm@11.17.0

COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY .npmrc ./
COPY tsconfig.base.json ./
COPY apps/server/package.json apps/server/
COPY apps/docs/package.json apps/docs/
COPY apps/web/package.json apps/web/
COPY apps/tasks/package.json apps/tasks/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
RUN pnpm --filter @putong-oj/shared build

COPY packages/db/ packages/db/
RUN pnpm --filter @putong-oj/db build

# Docs builder
FROM base_builder AS docs_builder
WORKDIR /app

COPY apps/docs/ apps/docs/
RUN pnpm --filter @putong-oj/docs build

# Web builder
FROM base_builder AS web_builder
WORKDIR /app

COPY apps/web/ apps/web/
COPY apps/server/ apps/server/
COPY --from=version_checker /app/version.txt .

RUN env \
    VITE_BUILD_SHA=$(cat version.txt) \
    VITE_BUILD_TIME=$(date +%s%3N) \
    pnpm --filter @putong-oj/web build

# Server deps
FROM base_builder AS server_deps
WORKDIR /app

RUN pnpm --filter @putong-oj/server deploy --legacy /app/server_deploy

# Server builder
FROM base_builder AS server_builder
WORKDIR /app

COPY apps/server/ apps/server/
RUN date +%s%3N > build_time.txt
RUN pnpm --filter @putong-oj/server build

# Runtime
FROM node:24-alpine AS runtime
WORKDIR /app

COPY --from=server_deps /app/server_deploy/node_modules ./node_modules
COPY --from=server_deps /app/server_deploy/package.json ./package.json

COPY --from=server_builder /app/apps/server/dist ./dist
COPY --from=web_builder /app/apps/web/dist ./public
COPY --from=docs_builder /app/apps/docs/.vitepress/dist ./public/docs

COPY --from=version_checker /app/version.txt .
COPY --from=server_builder /app/build_time.txt .

COPY apps/server/setup.js .
COPY apps/server/entrypoint.sh .
RUN chmod +x entrypoint.sh
RUN mkdir -p /app/data /app/logs /app/public/uploads

EXPOSE 3000/tcp
VOLUME [ "/app/data", "/app/logs", "/app/public/uploads" ]

ENTRYPOINT [ "/app/entrypoint.sh" ]
