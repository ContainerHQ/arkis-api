/* globals expect: true */

'use strict';

let _ = require('lodash'),
  format = require('../format');

function scopes(order=[[], []]) {
  let [attributes, sorts] = order;

  return [attributes || ['id'], sorts || ['asc']];
}

module.exports = function(belongsTo, modelName, opts, done) {
  return function(err, res) {
    if (err) { return done(err); }

    let models = format.response(res.body[modelName]);

    belongsTo[`get${_.capitalize(modelName)}`]()
    .then(format.serialize)
    .then(ownerModels => {
      expect(res.body.meta).to.deep.equal({
        limit: opts.limit,
        offset: opts.offset,
        total_count: ownerModels.length
      });
      let [attributes, sorts] = scopes(opts.order);

      return _(ownerModels)
      .sortByOrder(attributes, sorts)
      .slice(opts.offset, opts.offset + opts.limit)
      .value();
    })
    .then(ownerModels => {
      expect(models).to.deep.equal(ownerModels);
      done();
    }).catch(done);
  };
};
