'use strict';

const TIMESTAMPS = ['created_at', 'updated_at'];

/*
 * Format timestamps strings of a JSON response to real
 * Date objects.
 *
 */
module.exports.timestamps = function(model) {
  TIMESTAMPS.forEach(timestamp => {
    model[timestamp] = new Date(model[timestamp]);
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
