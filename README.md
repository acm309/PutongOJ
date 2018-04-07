# Putong Online Judge v2

(For version 1, please visit [here](https://github.com/acm309/PutongOJ/tree/v1))

[![Node](https://img.shields.io/badge/node-%3E=9.0-ff69b4.svg?style=flat-square)](https://nodejs.org/en/download/releases/)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)

~~Demo~~ (Not available currently, but coming soon)

## Documentation

Currently Not available

## Features

- Built on Docker -- One click Deployment
- Single Page Application -- Better User Experience
- Support multiple cases of test data

# Delpoyment

Note: This project is still during `BETA` stage

## Docker

1. clone this project

```bash
git clone https://github.com/acm309/PutongOJ.git PutongOJ
```

2. compose up

```bash
docker-compose up
```

or

daemon mode
```bash
docker-compose up -d
```

It will listen on 80 ports after it is successfully deployed. Then you can directly visit this platform.

Enjoy it!

## Manual Installation

Ubuntu is recommended. You can deploy this platform on other linux, but I can't ensure it must work.

1. install [Node.js](https://nodejs.org) [mongodb](https://www.mongodb.com/download-center?jmp=nav#community) && [redis](https://redis.io/)

2. install some system dependencies (for ubuntu)

```bash
apt-get install libcairo2-dev libpango1.0-dev build-essential
```

3. clone this repo

```bash
git clone https://github.com/acm309/PutongOJ.git
```

4. install project dependencies

```bash
npm i -g yarn
yarn
```

5. setup database connections

export variables

```bash
export redisURL='your redis url'
export dbURL='your mongodb url'
```

update `config/index.js`

```js
const prod = {
  port: 3000 // the port the application will listen on
}
```

6. setup static files and judger

```bash
node manager.js
```

`pm2.config.json` would be generated.

7. start

install pm2 first

```bash
npm i -g pm2
```

then start with pm2

```bash
pm2 start pm2.config.json
```
