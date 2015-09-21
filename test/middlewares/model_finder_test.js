'use strict';

let _ = require('lodash'),
  modelFinder = rewire('../../app/middlewares/model_finder');

describe('ModelFinder Middleware', () => {
  [
    { name: 'cluster',  belongsTo: 'user' },
    { name: 'node',     belongsTo: 'cluster' }
  ].forEach(({ name, belongsTo }) => {
    context(`when initialized for ${name}`, () => {
      let req, res, resource, find;

      beforeEach(() => {
        req = {};
        res = {};

        req[belongsTo] = factory.buildSync(belongsTo);
        resource       = factory.buildSync(name);

        return req[belongsTo].save().then(() => {
          let modelName = _.capitalize(name);

          return req[belongsTo][`add${modelName}`](resource);
        }).then(() => {
          find = modelFinder(name, { belongsTo: belongsTo });
        });
      });

      context('when id is not a uuid', () => {
        it('sends resource not found', done => {
          res.notFound = done;

          find(req, res, null, '.');
        });
      });

      context(
        `when resource matching this id belongs to the ${belongsTo}`
      , () => {
        beforeEach(done => {
          find(req, res, done, resource.id);
        });

        it('binds the resource found to the request', () => {
          expect(req[name].dataValues).to.deep.equal(resource.dataValues);
        });
      });

      context(
        `when resource matching this id doesn't belongs to the ${belongsTo}`
      , () => {
        let id;

        beforeEach(() => {
          return factory.buildSync(name).save().then(model => {
            id = model.id;
          });
        });

        it('sends resource not found', done => {
          res.notFound = done;

          find(req, res, null, id);
        });
      });
    });
  });
});
