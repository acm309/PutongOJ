#!/bin/sh

node setup.js
npx pm2 start pm2.config.json --no-daemon
