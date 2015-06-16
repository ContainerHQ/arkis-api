#!/bin/sh
set -e

#
# If GitHub application credentials are not available, skip tests
# related to GitHub authentication.
#
if [ "$GITHUB_CLIENT_ID" = "" ] || [ "$GITHUB_SECRET_KEY" = "" ]; then
    exclude="--grep github --invert"
fi

# Detect errors and potential problems
jshint app

NODE_ENV=test mocha $exclude $@
