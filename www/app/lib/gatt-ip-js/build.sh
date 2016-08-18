#!/usr/bin/env bash
set -e

mkdir -p dist/
rm -rf node_modules/
npm install
echo Browserifying...
browserify -r gatt-ip -i websocket > dist/gattip.js
echo Done