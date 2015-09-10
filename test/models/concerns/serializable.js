'use strict';

let _ = require('lodash');

module.exports = function(factoryName) {
  return function(opts={}) {
    describe('#serialize', () => {
      context(`with ${factoryName} factory`, () => {
        let params, model, serialized;

        beforeEach(() => {
          model = factory.buildSync(factoryName);
          return model.save().then(() => {
            params     = { baseUrl: random.string() };
            serialized = model.serialize(params);
          });
        });

        it(`removes ${opts.omit || 'nothing'} and
            add ${opts.merge || 'nothing'}`, () => {
          let expected = _(model.toJSON())
          .omit(opts.omit   || {})
          .merge(opts.merge || {})
          .value();

          expect(_.omit(serialized, 'links')).to.deep.equal(expected);
        });

        if (!!opts.links) {
          opts.links.forEach(link => {
            it(`add link to ${link}`, () => {
              let expected = {};

              expected[link] = `${params.baseUrl}/${model.id}/${link}`;

              expect(serialized.links[link]).to.deep.equal(expected[link]);
            });
          });
        }
      });
    });
  };
};
