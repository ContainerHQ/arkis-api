'use strict';

describe('Cert Model', () => {
  db.sync();

  describe('validations', () => {
    it('succeeds with valid attributes', done => {
      factory.create('cert', done);
    });

    ['client', 'server'].forEach(target => {
      ['cert', 'key', 'ca'].forEach(name => {
        it(`fails with null ${target}_${name}`, () => {
          let opts = {};

          opts[`${target}_${name}`] = null;

          return expect(factory.buildSync('cert', opts).save())
            .to.be.rejected;
        });
      });
    });
  });
});
