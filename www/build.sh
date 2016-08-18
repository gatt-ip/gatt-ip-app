#!/bin/bash
set -e
set -x
sudo rm -rf node_modules
sudo rm -rf bower_components
sudo npm cache clean
if [[ $1 == "dev" ]]; then
    rm -rf node_modules
    rm -rf bower_components
    npm install
    bower update
    gulp dev
elif [[ $1 == "prod" ]]; then
    rm -rf node_modules
    rm -rf node_modules
    npm install
    bower update
    gulp prod
fi

