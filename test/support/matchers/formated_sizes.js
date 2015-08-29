'use strict';

let _ = require('lodash');

const KEYS = [
  'slug',
  'memory',
  'disk',
  'transfer',
  'price_monthly',
  'price_hourly',
  'regions',
  'available',
  'cpu'
];

module.exports = function(sizes) {
  sizes.forEach(size => {
    let keys = Object.keys(size);

    if (!_.isEqual(keys, KEYS)) {
      throw new Error(`Size should have only ${KEYS} but have ${keys}!`);
    }
  });
  return true;
};
