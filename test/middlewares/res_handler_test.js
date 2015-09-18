'use strict';

let _ = require('lodash'),
  resHandler = require('../../app/middlewares').resHandler;

describe('Response Handler Middleware', () => {
  let req = { baseUrl: random.string() },
      res = {};

  beforeEach(done => {
    res.json = sinon.stub();
    res.status = sinon.stub().returns(res);

    resHandler(req, res, done);
  });

  describe('Extends the response object with:', () => {
    [
      ['notFound',     404],
      ['noContent',    204],
      ['unauthorized', 401],
      ['forbidden',    403],
    ].forEach(([method, statusCode]) => {
      describe(`#${method}`, () => {
        beforeEach(() => {
          res[method]();
        });

        it(`sends a ${method} status code (${statusCode})`, () => {
          expect(res.status).to.have.been.calledWith(statusCode);
        });

        it('sends a response', () => {
          expect(res.json).to.have.been.called;
        });
      });
    });

    describe('#serialize', () => {
      let data;

      beforeEach(() => {
        data = {
          object: generateSerializableObject(),
          collection: _.map([10], generateSerializableObject),
          value: random.string(),
          nonSerializable: {
            value: random.string()
          }
        };
        res.serialize(data)
      });

      it('serializes objects with serialize method', () => {
        expect(data.object.serialize).to.have.been.calledWith(req);
      })

      it('serializes each collection member with serialize method', () => {
        data.collection.forEach(obj => {
          expect(obj.serialize).to.have.been.calledWith(req);
        });
      });

      it("doesn't serialize an object without serialize method", () => {
        expect(res.json).to.have.been.calledWithMatch(
          _.pick(data, 'nonSerializable')
        );
      });

      it("doesn't serialize values", () => {
        expect(res.json).to.have.been.calledWithMatch(
          _.pick(data, 'value')
        );
      });

      it("doesn't fail with null values", () => {
        expect(function() {
          res.serialize({ empty: null });
        }).not.to.throw(Error);
      });

      it("doesn't fail with undefined values", () => {
        expect(function() {
          res.serialize({ empty: undefined });
        }).not.to.throw(Error);
      });

      it('sends the serialized response as json', () => {
        let serialized = _.omit(data, ['object', 'collection']);

        _.merge(serialized, {
          object: data.object.serialize(),
          collection: _.invoke(data.collection, 'serialize')
        });
        expect(res.json).to.have.been.calledWith(serialized);
      });

      function generateSerializableObject() {
        return { serialize: sinon.stub().returns(random.string()) };
      }
    });

  });
});
