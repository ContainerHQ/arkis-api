'use strict';

let support = require('../../app/support'),
  tokenDecoder = require('../../app/middlewares').tokenDecoder;

describe('Token Decoder Middleware', () => {
  let req;

  beforeEach(() => {
    req = {};
  });

  context('when token is a valid jwt', () => {
    const JIT = random.string();

    let token;

    beforeEach(() => {
      token = support.token.generate(JIT);
    });

    it('decodes the given jwt token', done => {
      tokenDecoder(req, {}, () => {
        expect(req.token.jit).to.equal(JIT);
        done();
      }, token);
    });
  });

  context('when token is invalid', () => {
    it('sends an authorized response', done => {
      tokenDecoder(req, { unauthorized: done }, null, '');
    });
  });
});
