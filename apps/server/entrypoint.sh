#!/bin/sh

export NODE_BUILD_SHA=$(cat version.txt 2>/dev/null || echo "")
export NODE_BUILD_TIME=$(cat build_time.txt 2>/dev/null || echo "")

node setup.js
exec node_modules/.bin/pm2-runtime start pm2.config.json
