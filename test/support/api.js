var request = require('supertest'),
  app = require('../../app');

const ROUTE = '/api/v1';

module.exports = {
  login: function(user) {
    return request(app)
    .post(`${ROUTE}/login`)
    .field('email', user.email)
    .field('password', user.password);
  }
};
