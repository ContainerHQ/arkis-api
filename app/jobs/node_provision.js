'use strict';

module.exports = function(queue) {
  let ActionJob = require('./action_job')(queue);

  class NodeProvision extends ActionJob {
    constructor(action) {
      super(action);

      this.type = 'node-provision';
    }
    process() {
      return Promise.resolve();
    }
  }
  return NodeProvision;
};
