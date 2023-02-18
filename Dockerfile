FROM node:16
ENV NODE_ENV production

WORKDIR /app

RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

RUN apt update && apt install -y gcc g++ unzip libcairo2-dev libpango1.0-dev build-essential default-jdk

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install -P && mv node_modules ../

COPY . .

EXPOSE 3000

RUN node manage.js

# pnpm fails with "ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL"
CMD ["npx", "pm2", "start", "pm2.config.json", "--no-daemon"]
