/* globals expect: true */

'use strict';

let _ = require('lodash');

module.exports = function (entity, filterName, filterValue, done) {
  return function(err, res) {
    if (err) {   console.log(res.body); return done(err); }

    let models = res.body[entity];

    if (_.isEmpty(models)) {
      return done(new Error(`response ${entity} is empty!`));
    }
    let allFiltered = _.all(models, model => {
      return _.isEqual(model[filterName], filterValue);
    });
    expect(allFiltered).to.deep.equal(true);
    done();
  };
};
