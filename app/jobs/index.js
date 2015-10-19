'use strict';

let _ = require('lodash'),
  kue = require('kue'),
  config = require('../../config'),
  models = require('../models');

let queue = kue.createQueue({
  prefix: config.jobs.prefix,
  redis:  config.store
});

let jobs = {
  NodeDeploy: require('./node_deploy')(queue)
};

['node-deploy'].forEach(type => {
  queue.process(type, 20, (job, done) => {
    models.Action.findById(job.data.action_id).then(action => {
      if (!action) { return done(); }

      let className = _.capitalize(_.camelCase(type));

      return new jobs[className](action).process();
    }).then(() => { done(); }).catch(done);
  });
});

module.exports = jobs;
