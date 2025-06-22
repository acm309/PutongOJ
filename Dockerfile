# Frontend
FROM node:22 AS frontend_builder

RUN git clone https://github.com/net-escape/ptoj-Frontend.git /app

WORKDIR /app

RUN npm i -g pnpm@latest-9 && \
    pnpm install
RUN pnpm run build

# Backend
FROM node:22
WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .
RUN npm i -g pnpm@latest-9 && \
    pnpm install -P

COPY . .
COPY --from=frontend_builder /app/dist /app/public

EXPOSE 3000/tcp

VOLUME [ "/app/data", "/app/logs", "/app/public/uploads" ]
ENTRYPOINT [ "entrypoint.sh" ]
