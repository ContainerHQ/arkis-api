var sequelize = require('../../models').sequelize;

/*
 * Drop database entries before each test.
 *
 */
module.exports.sync = function() {
  beforeEach((done) => {
    sequelize
    .sync({force: true})
    .then(() => { done(); })
    .catch(done);
  });
};
