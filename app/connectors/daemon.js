'use strict';

let request = require('superagent'),
  config = require('../../config'),
  errors = require('../support').errors;

class Daemon {
  constructor(node) {
    this.node = node;
  }
  update(attributes={}) {
    return this._call({ method: 'post', action: 'update', body: attributes });
  }
  upgrade(attributes={}) {
    return this._call({ method: 'post', action: 'upgrade', body: attributes });
  }
  _call({ method, action, body }) {
    let url = `https://${this.node.addr}:${config.agent.ports.api}/${action}`;

    return new Promise((resolve, reject) => {
      request[method](url)
      .timeout(config.agent.timeout)
      .set('Authorization', `JWT ${this.node.token}`)
      .send(body)
      .end((err, res) => {
        if (err) { return reject(new errors.AgentUnprocessableError(err)); }

        resolve(res);
      });
    });
  }
}

module.exports = Daemon;
