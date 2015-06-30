'use strict';

let docker = require('../../app/middlewares').docker;

describe('Docker Middleware', () => {
  it('adds a docker client to the request object', done => {
    let req = {};

    docker(req, {}, () => {
      expect(req.docker).to.exist;
      done();
    });
  });
});
