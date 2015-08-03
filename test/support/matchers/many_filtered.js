'use strict';

let _ = require('lodash');

module.exports = function (entity, filterName, filterValue, done) {
  return function(err, res) {
    if (err) { return done(err); }

    let models = res.body[entity];

    if (_.isEmpty(models)) {
      return done(new Error(`response ${entity} is empty!`));
    }
    expect(_.all(models, model => {
      return model[filterName] === filterValue;
    })).to.be.true;
    done();
  };
};
