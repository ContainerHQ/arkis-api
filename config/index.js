'use strict';

let _ = require('lodash'),
  versions = require('./versions');

let config = {
  versions: versions,
  latestVersions: _.first(versions),
  oldestVersions: _.last(versions),
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  auth: {
    github: {
      clientID:     process.env.GITHUB_CLIENT_ID  || '*',
      clientSecret: process.env.GITHUB_SECRET_KEY || '*'
    }
  },
  nodeDomain: 'node.arkis.io'
};

config.db = require('./database')[config.env];
config.secrets = require('./secrets')[config.env];

_.merge(config, require(`./environments/${config.env}`));
_.merge(config.db, {
  logging: config.logging,
  define: { underscored: true }
});

module.exports = config;
