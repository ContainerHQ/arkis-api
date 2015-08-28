#!/bin/sh
set -e

if [ "$NODE_ENV" = "" ]; then
    #./scripts/jslint.sh

    nodemon --ignore tests/
else
    node index.js
fi
