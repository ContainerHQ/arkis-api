#!/bin/sh
set -e

#
# If GitHub application credentials are not available, skip tests
# related to GitHub authentication.
#
if [ "$GITHUB_CLIENT_ID" = "" ] || [ "$GITHUB_SECRET_KEY" = "" ]; then
    exclude="--grep github --invert"
fi

# Detect errors and potential problems.
jshint app

# Launch mocha with istanbul coverage reports.
NODE_ENV=test istanbul cover _mocha -- $exclude $@

# Upload coverage report to codeclimate.
if [ $CODECLIMATE_REPO_TOKEN ]; then
    codeclimate-test-reporter < coverage/lcov.info
fi
