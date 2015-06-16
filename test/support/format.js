'use strict';

const TIMESTAMPS = ['created_at', 'updated_at'];

/*
 * Format timestamps strings of a JSON response to real
 * Date objects.
 *
 */
module.exports.timestamps = function(obj) {
  TIMESTAMPS.forEach(timestamp => {
    obj[timestamp] = new Date(obj[timestamp]);
  });
  return obj;
};
