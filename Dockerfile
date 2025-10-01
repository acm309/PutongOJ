# Base builder
FROM node:24-slim AS base_builder
WORKDIR /app

RUN npm i -g pnpm@latest-10

COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY shared/package.json shared/

RUN pnpm install --frozen-lockfile

COPY shared/ shared/

RUN pnpm --filter @putongoj/shared build

# Frontend builder
FROM base_builder AS frontend_builder
WORKDIR /app

COPY frontend/ frontend/
COPY backend/ backend/

RUN pnpm --filter @putongoj/frontend build

# Backend builder
FROM base_builder AS backend_builder
WORKDIR /app

COPY backend/ backend/

RUN pnpm --filter @putongoj/backend build
RUN pnpm --filter @putongoj/backend deploy /app/backend_deploy

# Runtime
FROM node:24-alpine AS runtime
WORKDIR /app

COPY --from=backend_builder /app/backend_deploy/node_modules ./node_modules
COPY --from=backend_builder /app/backend_deploy/package.json ./package.json

COPY --from=backend_builder /app/backend_deploy/dist ./dist
COPY --from=frontend_builder /app/frontend/dist ./public

COPY backend/setup.js .
COPY backend/entrypoint.sh .
RUN mkdir -p /app/data /app/logs /app/public/uploads

EXPOSE 3000/tcp
VOLUME [ "/app/data", "/app/logs", "/app/public/uploads" ]

ENTRYPOINT [ "/app/entrypoint.sh" ]
