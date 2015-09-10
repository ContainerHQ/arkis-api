'use strict';

let _ = require('lodash');

module.exports.extend = function(model, concerns, opts={}) {
  _.keys(concerns).forEach(name => {
    let concern = require(`./${name}`)(
      _(concerns[name]).merge(opts).value()
    );
    _.merge(model, concern);
  });
  return model;
};
