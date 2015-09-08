'use strict';

let _ = require('lodash');

class Serialize {
  static transform(value, opts={}) {
    return _.isFunction(value.serialize) ? value.serialize(opts) : value;
  }
  static all(data, opts) {
    return _.mapValues(data, value => {
      if (_.isArray(value)) {
        return _.map(value, obj => {
          return this.transform(obj, opts);
        });
      }
      if (_.isObject(value)) {
        return this.transform(value, opts);
      }
      return value;
    });
  }
}

module.exports = Serialize;
