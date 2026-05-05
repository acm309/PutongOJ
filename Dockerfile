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
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY shared/package.json shared/
RUN pnpm install --frozen-lockfile --filter="!document"

COPY shared/ shared/
RUN pnpm --filter @putongoj/shared build

# Frontend builder
FROM base_builder AS frontend_builder
WORKDIR /app

COPY frontend/ frontend/
COPY backend/ backend/
COPY --from=version_checker /app/version.txt .

RUN env \
    VITE_BUILD_SHA=$(cat version.txt) \
    VITE_BUILD_TIME=$(date +%s%3N) \
    pnpm --filter @putongoj/frontend build

# Backend deps
FROM base_builder AS backend_deps
WORKDIR /app

RUN pnpm --filter @putongoj/backend deploy /app/backend_deploy

# Backend builder
FROM base_builder AS backend_builder
WORKDIR /app

COPY backend/ backend/
RUN date +%s%3N > build_time.txt
RUN pnpm --filter @putongoj/backend build

# Runtime
FROM node:24-alpine AS runtime
WORKDIR /app

COPY --from=backend_deps /app/backend_deploy/node_modules ./node_modules
COPY --from=backend_deps /app/backend_deploy/package.json ./package.json

COPY --from=backend_builder /app/backend/dist ./dist
COPY --from=frontend_builder /app/frontend/dist ./public

COPY --from=version_checker /app/version.txt .
COPY --from=backend_builder /app/build_time.txt .

COPY backend/setup.js .
COPY backend/entrypoint.sh .
RUN chmod +x entrypoint.sh
RUN mkdir -p /app/data /app/logs /app/public/uploads

EXPOSE 3000/tcp
VOLUME [ "/app/data", "/app/logs", "/app/public/uploads" ]

ENTRYPOINT [ "/app/entrypoint.sh" ]
