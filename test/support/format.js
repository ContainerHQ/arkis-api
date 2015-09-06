'use strict';

let _ = require('lodash');

const TIMESTAMPS = [
  'created_at', 'updated_at', 'started_at', 'completed_at', 'last_ping'
];

/*
 * Format timestamps strings of a JSON response to real
 * Date objects.
 */
module.exports.timestamps = function(model) {
  TIMESTAMPS.forEach(timestamp => {
    if (!!model[timestamp]) {
      model[timestamp] = new Date(model[timestamp]);
    }
  });
  return model;
};

module.exports.allTimestamps = function(models) {
  return _.map(models, model => {
    return this.timestamps(model);
  });
};

module.exports.allToJSON = function(models) {
  return _.invoke(models, 'toJSON');
};
