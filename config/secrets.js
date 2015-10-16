'use strict';

module.exports = {
  development: {
    jwt: 'we <3 docker',
    ssh: 'world is mine',
    ssl: 'lolilol',
    aes: 'plop'
  },
  test: {
    jwt: 'we also <3 swarm',
    ssh: 'world is mine too',
    ssl: 'lolilol2',
    aes: 'zerkp'
  },
  production: {
    jwt: process.env.JWT_SECRET_KEY,
    ssh: process.env.SSH_PASSPHRASE,
    ssl: process.env.SSL_PASSPHRASE,
    aes: process.env.AES_SECRET_KEY
  }
};
