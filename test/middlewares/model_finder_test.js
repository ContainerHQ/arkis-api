'use strict';

let _ = require('lodash'),
  modelFinder = rewire('../../app/middlewares/model_finder');

describe('ModelFinder Middleware', () => {
  [
    { name: 'cluster',  belongsTo: 'user', findBy: { id: 'UUID', name: 'Ascii' } },
    { name: 'node',  belongsTo: 'cluster', findBy: { id: 'UUID', name: 'Ascii' } },
    { name: 'action',   belongsTo: 'node', findBy: { id: 'UUID' } }

  ].forEach(({ name, belongsTo, findBy }) => {
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
          find = modelFinder(name, { belongsTo: belongsTo, findBy: findBy });
        });
      });

      _.mapValues(findBy, (type, attribute) => {
        if (type === 'UUID') {
          context(`when ${attribute} is not a uuid`, () => {
            it('sends resource not found', done => {
              res.notFound = done;

              find(req, res, null, '.');
            });
          });
        }

        context(
          `when resource matching this ${attribute} belongs to the ${belongsTo}`
        , () => {
          beforeEach(done => {
            find(req, res, done, resource[attribute]);
          });

          it('binds the resource found to the request', () => {
            expect(req[name].dataValues).to.deep.equal(resource.dataValues);
          });
        });

        context(
          `when resource matching this ${attribute} doesn't belongs to the ${belongsTo}`
        , () => {
          let identifier;

          beforeEach(() => {
            return factory.buildSync(name).save().then(model => {
              identifier = model[attribute];
            });
          });

          it('sends resource not found', done => {
            res.notFound = done;

            find(req, res, null, identifier);
          });
        });
      });
    });
  });
});
