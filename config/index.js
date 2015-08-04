'use strict';

let _ = require('lodash'),
  versions = require('./versions');

module.exports = {
  latestVersions: _.first(versions),
  oldestVersions: _.last(versions)
};
