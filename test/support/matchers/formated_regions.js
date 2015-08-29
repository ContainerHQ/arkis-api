'use strict';

let _ = require('lodash');

const KEYS = [
  'name',
  'slug',
  'sizes',
  'available'
];

module.exports = function(regions) {
  regions.forEach(region => {
    let keys = Object.keys(region);

    if (!_.isEqual(keys, KEYS)) {
      throw new Error(`Region should have only ${KEYS} but have ${keys}!`);
    }
  });
  return true;
};
