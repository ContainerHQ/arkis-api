'use strict';

let _ = require('lodash'),
  sequelize = require('sequelize'),
  errors = require('../../app/support').errors,
  errorHandler = rewire('../../app/middlewares/error_handler');

const INTERNAL_SERVER_ERROR = errorHandler.__get__('INTERNAL_SERVER_ERROR');

describe('ErrorHandler Middleware', () => {
  let res = {}, fakeConsole;

  beforeEach(() => {
    res.json = sinon.stub();
    res.status = sinon.stub().returns(res);

    fakeConsole = { error: sinon.stub() };

    errorHandler.__set__('console', fakeConsole);
  });

  context(`with a ValidationError`, () => {
    let err = new sequelize.ValidationError();

    it('sends a bad request status', done => {
      errorHandler(err, {}, res, () => {
        expect(res.status).to.have.been.calledWith(400);
        done();
      });
    });

    it('sends validation errors', done => {
      errorHandler(err, {}, res, () => {
        expect(res.json).to.have.been.calledWith(
          format.error(err)
        );
        done();
      });
    });
  });

  [
    ['MismatchError', 400, 'test'],
    ['StateError', 422],
    ['AlreadyUpgradedError', 409],
    ['DeletionError', 409, [new errors.StateError()]],
    ['NotMasterError', 403],
    ['MachineCredentialsError', 401],
    ['MachineNotFoundError', 404],
    ['AgentUnreachableError', 422],
    ['AgentLockedError', 409],
    ['MachineUnprocessableError', 422, random.string()],
    ['PaginationError', 400, {
      attribute: 'limit',
      value: -5,
      range: [0, 25]
    }]
  ].forEach(([errorName, status, opts]) => {
    context(`with a ${errorName}`, () => {
      let err = new errors[errorName](opts);

      it(`sends a ${status} request status`, done => {
        errorHandler(err, {}, res, () => {
          expect(res.status).to.have.been.calledWith(status);
          done();
        });
      });

      it('sends the error message back', done => {
        errorHandler(err, {}, res, () => {
          let expected = format.error(err);

          expect(res.json).to.have.been.calledWith(expected);
          done();
        });
      });
    });
  });

  context('with any other error', () => {
    let err = new Error('whatever');

    it('sends an internal server error status', done => {
      errorHandler(err, {}, res, () => {
        expect(res.status).to.have.been.calledWith(500);
        done();
      });
    });

    it('sends an internal server error message', done => {
      errorHandler(err, {}, res, () => {
        expect(res.json)
          .to.have.been.calledWith(INTERNAL_SERVER_ERROR);
        done();
      });
    });

    it('logs the error message', done => {
      errorHandler(err, {}, res, () => {
        expect(fakeConsole.error).to.have.been.calledWith(err);
        done();
      });
    });
  });
});
