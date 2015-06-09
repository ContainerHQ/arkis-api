'use strict';

const TIMESTAMPS = ['created_at', 'updated_at'];

module.exports.timestamps = function(obj) {
  TIMESTAMPS.forEach(timestamp => {
    obj[timestamp] = new Date(obj[timestamp]);
  });
  return obj;
};
