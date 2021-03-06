/* globals expect: true */

'use strict';

let _ = require('lodash'),
  format = require('../format');

module.exports = function (belongsTo, modelName, opts, done) {
  return function(err, res) {
    if (err) { return done(err); }

    let name = _.capitalize(modelName),
      model  = format.response(res.body[modelName]),
      method = `get${name}`;

    if (!_.isFunction(belongsTo[method])) {
      method += 's';
    }

    belongsTo[method]({ where: { id: model.id } }).then(result => {
      return _.isArray(result) ? _.first(result) : result;
    }).then(ownerModel => {
      let serialized = format.serialize(ownerModel);

      expect(model).to.deep.equal(serialized);
      expect(ownerModel).to.containSubset(opts.with);
    }).then(done).catch(done);
  };
};
