'use strict';

module.exports.extend = function(name, key, obj, DataTypes={}) {
  let mixin = require(`./${name}`)(DataTypes);

  return _.merge(mixin[key], obj);
};
