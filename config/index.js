'use strict';

let _ = require('lodash'),
  Sequelize = require('sequelize'),
  versions = require('./versions');

let config = {
  versions: versions,
  latestVersions: _.first(versions),
  oldestVersions: _.last(versions),
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT    || 4000,
  auth: {
    github: {
      clientID:     process.env.GITHUB_CLIENT_ID  || '*',
      clientSecret: process.env.GITHUB_SECRET_KEY || '*'
    },
    machine: {
      token: process.env.DIGITAL_OCEAN_TOKEN || ''
    }
  },
  project: 'arkis',
  domain: 'arkis.io',
  agent: {
    cmd: 'curl -Ls https://get.arkis.io/ | sudo -H sh -s',
    ports: {
      api:    2374,
      docker: 2375,
      swarm:  2376
    },
    timeout: 5000, // In ms
    heartbeat: { amount: 5, key: 'minutes' }
  },
};

config.db = require('./database')[config.env];
config.secrets = require('./secrets')[config.env];

_.merge(config, require(`./environments/${config.env}`));
_.merge(config.db, {
  logging: config.logging,
  define: { underscored: true },
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
});

module.exports = config;
