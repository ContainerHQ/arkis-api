'use strict';

let _ = require('lodash');

class Serialize {
  static transform(value, opts={}) {
    let model = value || {};

    return _.isFunction(model.serialize) ? model.serialize(opts) : value;
  }
  static all(data, opts) {
    return _.mapValues(data, value => {
      if (_.isArray(value)) {
        return _.map(value, obj => {
          return this.transform(obj, opts);
        });
      }
      return this.transform(value, opts);
    });
  }
}

module.exports = Serialize;
