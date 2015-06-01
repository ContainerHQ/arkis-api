#!/bin/sh
set -e

#
# If GitHub application credentials are not available, skip tests
# related to GitHub authentication.
#
if [ "$GITHUB_CLIENT_ID" = "" ] || [ "$GITHUB_SECRET_KEY" = "" ]; then
    exclude="--grep github --invert"
fi

NODE_ENV=test mocha $exclude $@
