'use strict';

var request = require('supertest'),
  app = require('../../app');

const ROUTE = '/api/v1';

module.exports = {
  login: function(user={}) {
    return request(app)
    .post(`${ROUTE}/login`)
    .field('email', user.email || '')
    .field('password', user.password || '');
  },
  authGitHub: function() {
    return request(app)
    .get(`${ROUTE}/auth/github`);
  },
  getProfile: function(user) {
    return request(app)
    .get(`${ROUTE}/profile`)
    .set('Authorization', `JWT ${user.token}`);
  },
  updateProfile: function(user) {
    return request(app)
    .patch(`${ROUTE}/profile`)
    .set('Authorization', `JWT ${user.token}`);
  },
  changePassword: function(user) {
    return request(app)
    .patch(`${ROUTE}/change_password`)
    .set('Authorization', `JWT ${user.token}`);
  },
  cancelAccount: function(user) {
    return request(app)
    .delete(`${ROUTE}/cancel_account`)
    .set('Authorization', `JWT ${user.token}`);
  },
  newToken: function(user) {
    return request(app)
    .patch(`${ROUTE}/new_token`)
    .set('Authorization', `JWT ${user.token}`);
  }
};
