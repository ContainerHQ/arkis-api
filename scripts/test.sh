#!/bin/sh
set -e

./scripts/jslint.sh

exclude=""

#
# If GitHub application credentials are not available, skip tests
# related to GitHub authentication.
#
if [ "$GITHUB_CLIENT_ID" = "" ] || [ "$GITHUB_SECRET_KEY" = "" ]; then
    exclude="$exclude --grep github"
fi

#
# If DigitalOcean credentials are not available, skip tests
# related to DigitalOcean.
#
if [ "$DIGITAL_OCEAN_TOKEN" = "" ]; then
    exclude="$exclude --grep DigitalOcean"
fi

if [ "$exclude" != "" ]; then
    exclude="$exclude --invert"
fi

# Launch mocha with istanbul coverage reports.
NODE_ENV=test istanbul cover \
    -x **/docker/** \
    -x **/upgrade/** \
    _mocha -- $exclude $@

# Upload coverage report to codeclimate.
if [ $CODECLIMATE_REPO_TOKEN ]; then
    codeclimate-test-reporter < coverage/lcov.info
fi
