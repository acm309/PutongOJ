FROM node:9.5.0
ENV NODE_ENV production

WORKDIR /app

# https://github.com/kkarczmarczyk/docker-node-yarn/blob/master/latest/Dockerfile
RUN apt-get update && apt-get install -y curl apt-transport-https && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn

RUN apt-get install -y gcc g++

RUN npm install -g pm2

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install --production && mv node_modules ../

COPY . .

EXPOSE 3000

RUN node manage.js
CMD ["npx", "pm2", "start", "pm2.config.json", "--no-daemon"]
