'use strict';
let _ = require('lodash'),
  versions = require('../../../config/versions');

const LATEST_VERSIONS = _.first(versions);

module.exports = function(model) {
  ['docker', 'swarm'].forEach(binary => {
    let modelVersion = model[`${binary}_version`],
      latestVersion  = LATEST_VERSIONS[binary];

    if (modelVersion !== latestVersion) {
      throw new Error(`${binary} version is ${modelVersion} but should be ${latestVersion}!`);
    }
  });
  return true;
};
