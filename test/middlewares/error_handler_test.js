'use strict';

let errors = require('../../app/routes/shared/errors'),
  errorHandler = rewire('../../app/middlewares/error_handler');

const INTERNAL_SERVER_ERROR = errorHandler.__get__('INTERNAL_SERVER_ERROR');

describe('ErrorHandler Middleware', () => {
  let res = {}, handlerConsole;

  beforeEach(() => {
    res.send = sinon.stub();
    res.status = sinon.stub().returns(res);

    handlerConsole = { error: sinon.stub() };

    errorHandler.__set__('console', handlerConsole);
  });

  context('with a validation error', () => {
    let err = new errors.MismatchError('test');

    it('sends a bad request status', done => {
      errorHandler(err, {}, res, () => {
        expect(res.status).to.have.been.calledWith(400);
        done();
      });
    });

    it('sends validation errors', done => {
      errorHandler(err, {}, res, () => {
        expect(res.send).to.have.been.calledWith({ errors: err.errors });
        done();
      });
    });
  });

  context('with a forbidden error', () => {
    let err = new errors.ForbiddenError();

    it('sends an forbidden status', done => {
      errorHandler(err, {}, res, () => {
        expect(res.status).to.have.been.calledWith(403);
        done();
      });
    });

    it('sends no errors', done => {
      errorHandler(err, {}, res, () => {
        expect(res.send).to.have.been.calledWith();
        done();
      });
    });
  });

  context('with an unauthorized error', () => {
    let err = new errors.UnauthorizedError();

    it('sends an authorized status', done => {
      errorHandler(err, {}, res, () => {
        expect(res.status).to.have.been.calledWith(401);
        done();
      });
    });

    it('sends no errors', done => {
      errorHandler(err, {}, res, () => {
        expect(res.send).to.have.been.calledWith();
        done();
      });
    });
  });

  context('with any other error', () => {
    let err = new Error('whatever');

    it('sends an internal server error', done => {
      errorHandler(err, {}, res, () => {
        expect(res.status).to.have.been.calledWith(500);
        done();
      });
    });

    it('sends an internal server error ', done => {
      errorHandler(err, {}, res, () => {
        expect(res.send)
          .to.have.been.calledWith({ error: INTERNAL_SERVER_ERROR });
        done();
      });
    });

    it('logs the error message', done => {
      errorHandler(err, {}, res, () => {
        expect(handlerConsole.error).to.have.been.calledWith(err.message);
        done();
      });
    });
  });
});
