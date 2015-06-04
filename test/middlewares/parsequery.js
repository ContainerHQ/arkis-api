var parseQuery = require('../../app/middlewares').parseQuery;

const URL = 'http://127.0.0.1?a=2&b=3';

describe('ParseQuery Middleware', () => {
  it('parses the query string of a request object', (done) => {
    let req = { url: URL };

    parseQuery(req, null, () => {
      expect(req.query).to.deep.equal({a: '2', b: '3'});
      done();
    });
  });
});
