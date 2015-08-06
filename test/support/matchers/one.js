'use strict';

let _ = require('lodash');

module.exports = function (owner, modelName, opts, done) {
  return function(err, res) {
    if (err) { return done(err); }

    let model = format.timestamps(res.body[modelName]);

    owner[`get${_.capitalize(modelName)}s`]({ where: { id: model.id } })
    .then(ownerModels => {
      return _.first(ownerModels).toJSON();
    }).then(ownerModel => {
      expect(model)
        .to.deep.equal(ownerModel).and.include(opts.with)
      done();
    }).catch(done);
  };
};
