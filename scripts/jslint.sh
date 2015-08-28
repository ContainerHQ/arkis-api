#!/bin/sh
set -e

# Detect errors and potential problems.
jshint app test/support
