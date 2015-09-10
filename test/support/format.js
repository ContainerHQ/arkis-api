'use strict';

let _ = require('lodash');

const TIMESTAMPS = [
  'created_at', 'updated_at', 'started_at', 'completed_at', 'last_ping'
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
