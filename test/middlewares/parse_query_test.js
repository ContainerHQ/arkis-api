'use strict';

var parseQuery = require('../../app/middlewares').parseQuery;

describe('ParseQuery Middleware', () => {
  it('returns the query string as an object', done => {
    let req = { url: 'http://127.0.0.1?a=2&b=3' };

    parseQuery(req, null, () => {
      expect(req.query).to.deep.equal({a: '2', b: '3'});
      done();
    });
  });

  context('with a url without query string', () => {
    it('returns an empty object', done => {
      let req = { url: 'http://127.0.0.1' };

      parseQuery(req, null, () => {
        expect(req.query).to.deep.equal({});
        done();
      });
    });
  });
});
