'use strict';

var request = require('supertest'),
  app = require('../../app');

const API_ROUTE = '/api/v1';

module.exports.auth = {
  _ressource: 'auth',

  login: function(user={}) {
    return request(app)
    .post(`${API_ROUTE}/${this._ressource}/login`)
    .field('email', user.email || '')
    .field('password', user.password || '');
  },
  github: function() {
    return request(app)
    .get(`${API_ROUTE}/${this._ressource}/github`);
  }
};

module.exports.account = {
  _ressource: 'account',

  getProfile: function(user) {
    return request(app)
    .get(`${API_ROUTE}/${this._ressource}/profile`)
    .set('Authorization', `JWT ${user.token}`);
  },
  updateProfile: function(user) {
    return request(app)
    .patch(`${API_ROUTE}/${this._ressource}/profile`)
    .set('Authorization', `JWT ${user.token}`);
  },
  changePassword: function(user) {
    return request(app)
    .patch(`${API_ROUTE}/${this._ressource}/change_password`)
    .set('Authorization', `JWT ${user.token}`);
  },
  changeEmail: function(user) {
    return request(app)
    .patch(`${API_ROUTE}/${this._ressource}/change_email`)
    .set('Authorization', `JWT ${user.token}`);
  },
  cancel: function(user) {
    return request(app)
    .delete(`${API_ROUTE}/${this._ressource}/`)
    .set('Authorization', `JWT ${user.token}`);
  },
  newToken: function(user) {
    return request(app)
    .get(`${API_ROUTE}/${this._ressource}/new_token`)
    .set('Authorization', `JWT ${user.token}`);
  }
};

module.exports.callWithAttributes = function(attributes, reference, action) {
  attributes.forEach(attribute => {
    action = action.field(attribute, reference.dataValues[attribute]);
  });
  return action;
};
