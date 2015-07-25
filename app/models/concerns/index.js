'use strict';

let _ = require('lodash');

module.exports.extend = function(name, key, obj, DataTypes={}, opts={}) {
  let mixin = require(`./${name}`)(DataTypes, opts);

  return _.merge(mixin[key], obj);
};
