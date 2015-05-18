var expect = require('chai').expect,
  docker = require('../../middlewares').docker;

describe('Docker Middleware', () => {
  it('adds a docker client to the request object', (done) => {
    let req = {};

    docker(req, null, () => {
      expect(req.docker).to.exist;
      done();
    });
  });
});
