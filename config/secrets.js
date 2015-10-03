'use strict';

module.exports = {
  development: {
    jwt: 'we <3 docker',
    ssh: 'world is mine'
  },
  test: {
    jwt: 'we also <3 swarm',
    ssh: 'world is mine too'
  },
  production: {
    jwt: process.env.JWT_SECRET_KEY,
    ssh: process.env.SSH_PASSWORD
  }
};
