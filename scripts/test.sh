#!/bin/sh
set -e

exclude=""

#
# If GitHub application credentials are not available, skip tests
# related to GitHub authentication.
#
if [ "$GITHUB_CLIENT_ID" = "" ] || [ "$GITHUB_SECRET_KEY" = "" ]; then
    exclude="$exclude github"
fi

#
# If DigitalOcean credentials are not available, skip tests
# related to DigitalOcean.
#
if [ "$DIGITAL_OCEAN_TOKEN" = "" ]; then
    exclude="$exclude DigitalOcean"
fi

# Detect errors and potential problems.
jshint app test/support

# Launch mocha with istanbul coverage reports.
NODE_ENV=test istanbul cover \
    -x **/docker/** \
    -x **/upgrade/** \
    _mocha -- --grep $exclude --invert $@


# Upload coverage report to codeclimate.
if [ $CODECLIMATE_REPO_TOKEN ]; then
    codeclimate-test-reporter < coverage/lcov.info
fi
