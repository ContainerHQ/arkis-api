/* globals expect: true */

'use strict';

let _ = require('lodash'),
  format = require('../format');

module.exports = function(owner, modelName, opts, done) {
  return function(err, res) {
    if (err) { return done(err); }

    let models = format.allTimestamps(res.body[modelName]);

    owner[`get${_.capitalize(modelName)}`]()
    .then(format.allToJSON)
    .then(ownerModels => {
      expect(res.body.meta).to.deep.equal({
        limit: opts.limit,
        offset: opts.offset,
        total_count: ownerModels.length
      });
      return _.slice(ownerModels, opts.offset, opts.offset + opts.limit);
    })
    .then(ownerModels => {
      expect(models).to.deep.equal(ownerModels);
      done();
    }).catch(done);
  };
};
