'use strict';
let _ = require('lodash'),
  config = require('../../../config');

module.exports = function(model) {
  ['docker', 'swarm'].forEach(binary => {
    let modelVersion = model[`${binary}_version`],
      latestVersion  = config.latestVersions[binary];

    if (modelVersion !== latestVersion) {
      throw new Error(`${binary} version is ${modelVersion} but should be ${latestVersion}!`);
    }
  });
  return true;
};
