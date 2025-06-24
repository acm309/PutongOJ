# Frontend Builder
FROM node:22 AS frontend_builder

RUN git clone https://github.com/net-escape/ptoj-frontend.git /app

WORKDIR /app

RUN npm i -g pnpm@latest-9 && \
    pnpm install
RUN pnpm run build

# Backend Builder
FROM node:22 AS backend_builder
WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .
RUN npm i -g pnpm@latest-9 && \
    pnpm install

COPY . .
RUN pnpm run build

# Runtime
FROM node:22
WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .
RUN npm i -g pnpm@latest-9 && \
    pnpm install -P

COPY --from=backend_builder /app/dist /app/dist
COPY --from=frontend_builder /app/dist /app/public

COPY setup.js .
COPY entrypoint.sh .
RUN mkdir -p /app/data /app/logs /app/public/uploads && \
    chmod +x entrypoint.sh

EXPOSE 3000/tcp

VOLUME [ "/app/data", "/app/logs", "/app/public/uploads" ]
ENTRYPOINT [ "/app/entrypoint.sh" ]
