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
  /*
   * Format error types/name to snake case and removes sequelize indications.
   * Also remove type and set name to type for some errors using "type" instead
   * of "name" in order to be consistent with all errors.
   */
  static error(error) {
    return _.mapValues(error, (value, key) => {
      switch (key) {
        case 'name':
          return _.snakeCase(value.replace('Sequelize', ''));
        case 'errors':
          return _.map(value, err => {
            err.name = _.snakeCase(err.name || err.type);
            delete err.type;
            return err;
          });
        default:
          return value;
      }
    });
  }
}

module.exports = Serialize;
