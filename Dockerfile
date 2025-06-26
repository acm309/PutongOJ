# Frontend Builder
FROM node:22 AS frontend_builder
WORKDIR /app/frontend

COPY frontend/package.json .
COPY frontend/pnpm-lock.yaml .
RUN npm i -g pnpm@latest-10 && \
    pnpm install

COPY . /app
RUN pnpm run build

# Backend Builder
FROM node:22 AS backend_builder
WORKDIR /app/backend

COPY backend/package.json .
COPY backend/pnpm-lock.yaml .
RUN npm i -g pnpm@latest-10 && \
    pnpm install

COPY . /app
RUN pnpm run build

# Runtime
FROM node:22
WORKDIR /app

COPY backend/package.json .
COPY backend/pnpm-lock.yaml .
RUN npm i -g pnpm@latest-10 && \
    pnpm install -P

COPY --from=backend_builder /app/backend/dist /app/dist
COPY --from=frontend_builder /app/frontend/dist /app/public

COPY backend/setup.js .
COPY backend/entrypoint.sh .
RUN mkdir -p /app/data /app/logs /app/public/uploads

EXPOSE 3000/tcp

VOLUME [ "/app/data", "/app/logs", "/app/public/uploads" ]
ENTRYPOINT [ "/app/entrypoint.sh" ]
