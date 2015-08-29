'use strict';

let request = require('supertest'),
  qs = require('qs'),
  app = require('../../app');

const API_ROUTE = '/api/v1';

module.exports.auth = {
  ressource: `${API_ROUTE}/auth`,

  login: function(user={}) {
    return request(app)
    .post(`${this.ressource}/login`)
    .field('email', user.email || '')
    .field('password', user.password || '');
  },
  github: function() {
    return request(app)
    .get(`${this.ressource}/github`);
  }
};

module.exports.regions = function(user={}) {
  let ressource = `${API_ROUTE}/regions`;

  return {
    getAll: function() {
      return request(app)
      .get(`${ressource}`)
      .set('Authorization', `JWT ${user.token}`);
    }
  };
};

module.exports.nodeSizes = function(user={}) {
  let ressource = `${API_ROUTE}/nodesizes`;

  return {
    getAll: function() {
      return request(app)
      .get(`${ressource}`)
      .set('Authorization', `JWT ${user.token}`);
    }
  };
};

module.exports.account = function(user={}) {
  let ressource = `${API_ROUTE}/account`;

  return {
    getProfile: function() {
      return request(app)
      .get(`${ressource}/profile`)
      .set('Authorization', `JWT ${user.token}`);
    },
    updateProfile: function() {
      return request(app)
      .patch(`${ressource}/profile`)
      .set('Authorization', `JWT ${user.token}`);
    },
    changePassword: function() {
      return request(app)
      .patch(`${ressource}/change_password`)
      .set('Authorization', `JWT ${user.token}`);
    },
    changeEmail: function() {
      return request(app)
      .patch(`${ressource}/change_email`)
      .set('Authorization', `JWT ${user.token}`);
    },
    cancel: function() {
      return request(app)
      .delete(`${ressource}/`)
      .set('Authorization', `JWT ${user.token}`);
    },
    generateNewToken: function() {
      return request(app)
      .get(`${ressource}/new_token`)
      .set('Authorization', `JWT ${user.token}`);
    }
  };
};

module.exports.agent = function(node={}) {
  let ressource = `${API_ROUTE}/agent`,
    swarm_ressource = 'clusters';

  return {
    infos: function() {
      return request(app)
      .get(`${ressource}/${node.token}/infos`);
    },
    notify: function(form) {
      return request(app)
      .post(`${ressource}/${node.token}/notify`)
      .send(form);
    },
    register: function(ip) {
      return request(app)
      .post(`${ressource}/${swarm_ressource}/${node.token}`)
      .send(ip);
    },
    fetch: function() {
      return request(app)
      .get(`${ressource}/${swarm_ressource}/${node.token}`);
    }
  };
};

module.exports.clusters = function(user={}) {
  let ressource = `${API_ROUTE}/clusters`;

  return {
    get: function(id) {
      return request(app)
      .get(`${ressource}/${id}`)
      .set('Authorization', `JWT ${user.token}`);
    },
    getAll: function(opts={}) {
      let params = qs.stringify(opts);

      return request(app)
      .get(`${ressource}?${params}`)
      .set('Authorization', `JWT ${user.token}`);
    },
    create: function() {
      return request(app)
      .post(`${ressource}/`)
      .set('Authorization', `JWT ${user.token}`);
    },
    update: function(id) {
      return request(app)
      .patch(`${ressource}/${id}`)
      .set('Authorization', `JWT ${user.token}`);
    },
    delete: function(id) {
      return request(app)
      .delete(`${ressource}/${id}`)
      .set('Authorization', `JWT ${user.token}`);
    },
    upgrade: function(id) {
      return request(app)
      .post(`${ressource}/${id}/upgrade`)
      .set('Authorization', `JWT ${user.token}`);
    },
    nodes: function(cluster={}) {
      ressource = `${ressource}/${cluster.id}/nodes`;

      return {
        get: function(id) {
          return request(app)
          .get(`${ressource}/${id}`)
          .set('Authorization', `JWT ${user.token}`);
        },
        getAll: function(opts={}) {
          let params = qs.stringify(opts);

          return request(app)
          .get(`${ressource}?${params}`)
          .set('Authorization', `JWT ${user.token}`);
        },
        create: function() {
          return request(app)
          .post(`${ressource}/`)
          .set('Authorization', `JWT ${user.token}`);
        },
        update: function(id) {
          return request(app)
          .patch(`${ressource}/${id}`)
          .set('Authorization', `JWT ${user.token}`);
        },
        delete: function(id) {
          return request(app)
          .delete(`${ressource}/${id}`)
          .set('Authorization', `JWT ${user.token}`);
        },
        upgrade: function(id) {
          return request(app)
          .post(`${ressource}/${id}/upgrade`)
          .set('Authorization', `JWT ${user.token}`);
        }
      };
    }
  };
};
