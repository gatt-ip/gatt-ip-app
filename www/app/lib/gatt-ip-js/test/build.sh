#!/usr/bin/env bash
set -e

if [[ -d node_modules/gatt-ip/ ]]; then
    chmod u+w node_modules/gatt-ip/*
fi
rm -rf node_modules/
npm install
