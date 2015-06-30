'use strict';

let resHandler = require('../../app/middlewares').resHandler;

describe('Response Handler Middleware', () => {
  let res = {};

  beforeEach(done => {
    res.json = sinon.stub();
    res.status = sinon.stub().returns(res);

    resHandler({}, res, done);
  });

  describe('Extend the response object with:', () => {
    describe('.notFound()', () => {
      beforeEach(() => {
        res.notFound();
      });

      it('sends a not found status', () => {
        expect(res.status).to.have.been.calledWith(404);
      });

      it('sends an empty body', () => {
        expect(res.json).to.have.been.calledWith();
      });
    });

    describe('.noContent()', () => {
      beforeEach(() => {
        res.noContent();
      });

      it('sends a no content status', () => {
        expect(res.status).to.have.been.calledWith(204);
      });

      it('sends an empty body', () => {
        expect(res.json).to.have.been.calledWith();
      });
    });

    describe('.unauthorized()', () => {
      beforeEach(() => {
        res.unauthorized();
      });

      it('sends an unauthorized status', () => {
        expect(res.status).to.have.been.calledWith(401);
      });

      it('sends an empty body', () => {
        expect(res.json).to.have.been.calledWith();
      });
    });

    describe('.forbidden()', () => {
      beforeEach(() => {
        res.forbidden();
      });

      it('sends a forbidden status', () => {
        expect(res.status).to.have.been.calledWith(403);
      });

      it('sends an empty body', () => {
        expect(res.json).to.have.been.calledWith();
      });
    });

  });
});
