'use strict';

module.exports = {
  development: {
    jwt: 'we <3 docker'
  },
  test: {
    jwt: 'we also <3 swarm'
  },
  production: {
    jwt: process.env.JWT_SECRET_KEY
  }
};
