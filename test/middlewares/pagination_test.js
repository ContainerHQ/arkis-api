'use strict';

let errors = require('../../app/support').errors,
  pagination = require('../../app/middlewares').pagination;

const DEFAULT_LIMIT  = 25,
      DEFAULT_OFFSET = 0

describe('Pagination Middleware', () => {
  it('parses the pagination parameters from the query string', done => {
    let req = { query: { limit: 10, offset: 12 } };

    pagination(req, {}, () => {
      expect(req.pagination).to.deep.equal({
        limit: req.query.limit,
        offset: req.query.offset,
        group: ['id']
      });
      done();
    });
  });

  [0, null, undefined].forEach(value => {
    context(`with a limit of ${value}`, () => {
      let req = { query: { limit: value, offset: 12 } };

      it('has a default limit', done => {
        pagination(req, {}, () => {
          expect(req.pagination).to.deep.equal({
            limit: DEFAULT_LIMIT,
            offset: req.query.offset,
            group: ['id']
          });
          done();
        });
      })
    });
  });

  context('when offset is not specified', () => {
    let req = { query: { limit: 12 } };

    it('has a default offset', done => {
      pagination(req, {}, () => {
        expect(req.pagination).to.deep.equal({
          limit: req.query.limit,
          offset: DEFAULT_OFFSET,
          group: ['id']
        });
        done();
      });
    })
  });

  ['limit', 'offset'].forEach(key => {
    [-1, -6, -25, 26, 32, 38, 150].forEach(value => {
      context(`whith a ${key} of ${value}`, () => {
        let req = { query: {} };

        req.query[key] = value;

        if (value > 0 && key === 'offset') {
          it("doesn't throw an error", done => {
            pagination(req, {}, done);
          });
        } else {
          it('throws a pagination error', () => {
            expect(() => { pagination(req, {}) })
            .to.throw(Error).that.deep.equals(new errors.PaginationError({
                attribute: key,
                value: value,
                range: key === 'offset' ? { start: 0 } : { start: 0, end: 25 }
              }));
          });
        }
      });
    });
  });

  describe('Extends the response object with:', () => {
    let res = {},
      req = { query: {
        limit:  random.positiveInt(10),
        offset: random.positiveInt(12)
      }};

    beforeEach(done => {
      res.serialize = sinon.stub(res.serialize);
      pagination(req, res, done);
    });

    describe('#paginate()', () => {
      it('returns a function to send the paginated model(s)', () => {
        let entity = random.string(),
          send = res.paginate(entity),
          result = {
            rows:  random.string(),
            count: random.string()
          },
          expected = { meta: {
            limit: req.query.limit,
            offset: req.query.offset,
            total_count: result.count.length
          }};
        expected[entity] = result.rows;

        send(result);

        expect(res.serialize).to.have.been.calledWithMatch(expected);
      });
    });
  });
});
