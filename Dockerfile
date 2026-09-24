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

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY .npmrc ./
COPY tsconfig.base.json ./
COPY turbo.json ./
COPY apps/server/package.json apps/server/
COPY apps/docs/package.json apps/docs/
COPY apps/web/package.json apps/web/
COPY apps/ws-server/package.json apps/ws-server/
COPY apps/worker/package.json apps/worker/
COPY apps/judger/package.json apps/judger/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
RUN pnpm --filter @putong-oj/shared build

COPY packages/db/ packages/db/
RUN pnpm --filter @putong-oj/db build

# Application builder
FROM base_builder AS app_builder
WORKDIR /app

COPY apps/ apps/
COPY --from=version_checker /app/version.txt .
RUN date +%s%3N > build_time.txt && \
    env \
      VITE_BUILD_SHA=$(cat version.txt) \
      VITE_BUILD_TIME=$(cat build_time.txt) \
      pnpm build

# Runtime
FROM node:24-alpine AS runtime
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/server/package.json apps/server/
COPY apps/ws-server/package.json apps/ws-server/
COPY apps/worker/package.json apps/worker/
COPY apps/judger/package.json apps/judger/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN npm i -g pnpm@11.17.0 && pnpm install --prod --frozen-lockfile

COPY --from=app_builder /app/apps/server/dist ./apps/server/dist
COPY --from=app_builder /app/apps/ws-server/dist ./apps/ws-server/dist
COPY --from=app_builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=app_builder /app/apps/judger/dist ./apps/judger/dist
COPY --from=app_builder /app/apps/web/dist ./apps/server/public
COPY --from=app_builder /app/apps/docs/.vitepress/dist ./apps/server/public/docs
COPY --from=app_builder /app/packages/db/dist ./packages/db/dist
COPY --from=app_builder /app/packages/shared/dist ./packages/shared/dist

COPY --from=version_checker /app/version.txt .
COPY --from=app_builder /app/build_time.txt .

COPY setup.js .
COPY apps/server/entrypoint.sh .
RUN chmod +x entrypoint.sh
RUN mkdir -p /app/apps/server/data /app/logs /app/apps/server/public/uploads

EXPOSE 3000/tcp 3001/tcp
VOLUME [ "/app/apps/server/data", "/app/logs", "/app/apps/server/public/uploads" ]

ENTRYPOINT [ "/app/entrypoint.sh" ]
