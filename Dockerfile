# Version checker
FROM node:24-alpine AS version_checker
WORKDIR /app

RUN apk add --no-cache git

COPY .git/ .git/
RUN echo $(git rev-parse --short HEAD) > version.txt

# Base builder
FROM node:24-slim AS base_builder
WORKDIR /app

RUN npm i -g pnpm@latest-11

COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./
COPY apps/server/package.json apps/server/
COPY apps/docs/package.json apps/docs/
COPY apps/web/package.json apps/web/
COPY apps/cli/package.json apps/cli/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
RUN pnpm --filter @putongoj/shared build

# Documentation builder
FROM base_builder AS document_builder
WORKDIR /app

COPY apps/docs/ apps/docs/
RUN pnpm --filter @putongoj/docs build

# Frontend builder
FROM base_builder AS frontend_builder
WORKDIR /app

COPY apps/web/ apps/web/
COPY apps/server/ apps/server/
COPY --from=version_checker /app/version.txt .

RUN env \
    VITE_BUILD_SHA=$(cat version.txt) \
    VITE_BUILD_TIME=$(date +%s%3N) \
    pnpm --filter @putongoj/web build

# Backend deps
FROM base_builder AS backend_deps
WORKDIR /app

RUN pnpm --filter @putongoj/server deploy /app/server_deploy

# Backend builder
FROM base_builder AS backend_builder
WORKDIR /app

COPY apps/server/ apps/server/
RUN date +%s%3N > build_time.txt
RUN pnpm --filter @putongoj/server build

# Runtime
FROM node:24-alpine AS runtime
WORKDIR /app

COPY --from=backend_deps /app/server_deploy/node_modules ./node_modules
COPY --from=backend_deps /app/server_deploy/package.json ./package.json

COPY --from=backend_builder /app/apps/server/dist ./dist
COPY --from=frontend_builder /app/apps/web/dist ./public
COPY --from=document_builder /app/apps/docs/.vitepress/dist ./public/docs

COPY --from=version_checker /app/version.txt .
COPY --from=backend_builder /app/build_time.txt .

COPY apps/server/setup.js .
COPY apps/server/entrypoint.sh .
RUN chmod +x entrypoint.sh
RUN mkdir -p /app/data /app/logs /app/public/uploads

EXPOSE 3000/tcp
VOLUME [ "/app/data", "/app/logs", "/app/public/uploads" ]

ENTRYPOINT [ "/app/entrypoint.sh" ]
