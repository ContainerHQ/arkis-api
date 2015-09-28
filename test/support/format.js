'use strict';

let _ = require('lodash');

const TIMESTAMPS = [
  'created_at', 'updated_at', 'started_at', 'completed_at', 'last_seen'
];

const IGNORE = ['links'];

function singleResponse(model) {
  TIMESTAMPS.forEach(timestamp => {
    if (!!model[timestamp]) {
      model[timestamp] = new Date(model[timestamp]);
    }
  });
  return _.omit(model, IGNORE);
}

module.exports.response = function(model) {
  if (_.isArray(model)) {
    return _.map(model, singleModel => {
      return singleResponse(singleModel);
    });
  }
  return singleResponse(model);
};

function singleSerialize(model) {
  let opts = { baseUrl: '' },
    serialized = _.isFunction(model.serialize) ? model.serialize(opts) : model.toJSON();

  return _.omit(serialized, IGNORE);
}

module.exports.serialize = function(model) {
  if (_.isArray(model)) {
    return _.map(model, singleModel => {
      return singleSerialize(singleModel);
    });
  }
  return singleSerialize(model);
};

/*
 * This function is a bit dangerous, we need to cloneDeep the errors for some
 * tests which are moving the same error object in and out.
 */
module.exports.error = function(error) {
  return _.mapValues(_.cloneDeep(error), (value, key) => {
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
};
