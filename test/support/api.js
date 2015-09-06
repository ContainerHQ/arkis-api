'use strict';

let request = require('supertest'),
  qs = require('qs'),
  app = require('../../app');

const API_ROUTE = '/api/v1';

module.exports.auth = {
  resource: `${API_ROUTE}/auth`,

  login: function(user={}) {
    return request(app)
    .post(`${this.resource}/login`)
    .field('email', user.email || '')
    .field('password', user.password || '');
  },
  github: function() {
    return request(app)
    .get(`${this.resource}/github`);
  }
};

module.exports.regions = function(user={}) {
  let resource = `${API_ROUTE}/regions`;

  return {
    getAll: function() {
      return request(app)
      .get(`${resource}`)
      .set('Authorization', `JWT ${user.token}`);
    }
  };
};

module.exports.nodeSizes = function(user={}) {
  let resource = `${API_ROUTE}/nodesizes`;

  return {
    getAll: function() {
      return request(app)
      .get(`${resource}`)
      .set('Authorization', `JWT ${user.token}`);
    }
  };
};

module.exports.account = function(user={}) {
  let resource = `${API_ROUTE}/account`;

  return {
    getProfile: function() {
      return request(app)
      .get(`${resource}/profile`)
      .set('Authorization', `JWT ${user.token}`);
    },
    updateProfile: function() {
      return request(app)
      .patch(`${resource}/profile`)
      .set('Authorization', `JWT ${user.token}`);
    },
    changePassword: function() {
      return request(app)
      .patch(`${resource}/change_password`)
      .set('Authorization', `JWT ${user.token}`);
    },
    changeEmail: function() {
      return request(app)
      .patch(`${resource}/change_email`)
      .set('Authorization', `JWT ${user.token}`);
    },
    cancel: function() {
      return request(app)
      .delete(`${resource}/`)
      .set('Authorization', `JWT ${user.token}`);
    },
    generateNewToken: function() {
      return request(app)
      .get(`${resource}/new_token`)
      .set('Authorization', `JWT ${user.token}`);
    }
  };
};

module.exports.agent = function(node={}) {
  let resource = `${API_ROUTE}/agent`,
    swarm_resource = 'clusters';

  return {
    infos: function() {
      return request(app)
      .get(`${resource}/${node.token}/infos`);
    },
    notify: function(form) {
      return request(app)
      .post(`${resource}/${node.token}/notify`)
      .send(form);
    },
    register: function(ip) {
      return request(app)
      .post(`${resource}/${swarm_resource}/${node.token}`)
      .send(ip);
    },
    fetch: function() {
      return request(app)
      .get(`${resource}/${swarm_resource}/${node.token}`);
    }
  };
};

module.exports.clusters = function(user={}) {
  let resource = `${API_ROUTE}/clusters`;

  return {
    get: function(id) {
      return request(app)
      .get(`${resource}/${id}`)
      .set('Authorization', `JWT ${user.token}`);
    },
    getAll: function(opts={}) {
      let params = qs.stringify(opts);

      return request(app)
      .get(`${resource}?${params}`)
      .set('Authorization', `JWT ${user.token}`);
    },
    create: function() {
      return request(app)
      .post(`${resource}/`)
      .set('Authorization', `JWT ${user.token}`);
    },
    update: function(id) {
      return request(app)
      .patch(`${resource}/${id}`)
      .set('Authorization', `JWT ${user.token}`);
    },
    delete: function(id) {
      return request(app)
      .delete(`${resource}/${id}`)
      .set('Authorization', `JWT ${user.token}`);
    },
    upgrade: function(id) {
      return request(app)
      .post(`${resource}/${id}/upgrade`)
      .set('Authorization', `JWT ${user.token}`);
    },
    nodes: function(cluster={}) {
      resource = `${resource}/${cluster.id}/nodes`;

      return {
        get: function(id) {
          return request(app)
          .get(`${resource}/${id}`)
          .set('Authorization', `JWT ${user.token}`);
        },
        getAll: function(opts={}) {
          let params = qs.stringify(opts);

          return request(app)
          .get(`${resource}?${params}`)
          .set('Authorization', `JWT ${user.token}`);
        },
        create: function() {
          return request(app)
          .post(`${resource}/`)
          .set('Authorization', `JWT ${user.token}`);
        },
        update: function(id) {
          return request(app)
          .patch(`${resource}/${id}`)
          .set('Authorization', `JWT ${user.token}`);
        },
        delete: function(id) {
          return request(app)
          .delete(`${resource}/${id}`)
          .set('Authorization', `JWT ${user.token}`);
        },
        upgrade: function(id) {
          return request(app)
          .post(`${resource}/${id}/upgrade`)
          .set('Authorization', `JWT ${user.token}`);
        },
        actions: function(node={}) {
          resource = `${resource}/${node.id}/actions`;

          return {
            get: function(id) {
              return request(app)
              .get(`${resource}/${id}`)
              .set('Authorization', `JWT ${user.token}`);
            },
            getAll: function(opts={}) {
              let params = qs.stringify(opts);

              return request(app)
              .get(`${resource}?${params}`)
              .set('Authorization', `JWT ${user.token}`);
            }
          };
        }
      };
    }
  };
};
