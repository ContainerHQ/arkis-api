'use strict';

let request = require('supertest'),
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

module.exports.account = function(user={}) {
  let ressource = 'account';

  return {
    getProfile: function() {
      return request(app)
      .get(`${API_ROUTE}/${ressource}/profile`)
      .set('Authorization', `JWT ${user.token}`);
    },
    updateProfile: function() {
      return request(app)
      .patch(`${API_ROUTE}/${ressource}/profile`)
      .set('Authorization', `JWT ${user.token}`);
    },
    changePassword: function() {
      return request(app)
      .patch(`${API_ROUTE}/${ressource}/change_password`)
      .set('Authorization', `JWT ${user.token}`);
    },
    changeEmail: function() {
      return request(app)
      .patch(`${API_ROUTE}/${ressource}/change_email`)
      .set('Authorization', `JWT ${user.token}`);
    },
    cancel: function() {
      return request(app)
      .delete(`${API_ROUTE}/${ressource}/`)
      .set('Authorization', `JWT ${user.token}`);
    },
    generateNewToken: function() {
      return request(app)
      .get(`${API_ROUTE}/${ressource}/new_token`)
      .set('Authorization', `JWT ${user.token}`);
    }
  };
};

module.exports.clusters = function(user={}) {
  let ressource = 'clusters';

  return {
    get: function(id) {
      return request(app)
      .get(`${API_ROUTE}/${ressource}/${id}`)
      .set('Authorization', `JWT ${user.token}`);
    },
    getAll: function() {
      return request(app)
      .get(`${API_ROUTE}/${ressource}/`)
      .set('Authorization', `JWT ${user.token}`);
    },
    create: function() {
      return request(app)
      .post(`${API_ROUTE}/${ressource}/`)
      .set('Authorization', `JWT ${user.token}`);
    },
    delete: function(id) {
      return request(app)
      .delete(`${API_ROUTE}/${ressource}/${id}`)
      .set('Authorization', `JWT ${user.token}`);
    }
  };
};
