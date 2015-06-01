var sequelize = require('../../models').sequelize,
  User = require('../../models').User;

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

/*
 * Create a user before each test.
 * Returns a function to get this user.
 *
 */
module.exports.createUser = function(attributes) {
  let createdUser;

  beforeEach((done) => {
    User
    .create(attributes)
    .then((user) => {
      createdUser = user;
      done();
    })
    .catch(done);
  });

  return function() {
    return createdUser;
  };
};
