var expect = require('chai').expect,
  db = require('../../support/db'),
  api = require('../../support/api');

const GITHUB_LOGIN_ROUTE = 'https://github.com/login/oauth/authorize';

describe('GET /auth/github', () => {
  it('redirect the user to github auth', (done) => {
    api
    .authGitHub()
    .expect(302)
    .end((err, res) => {
      if (err) { return done(err); };

      expect(res.headers.location).to.contain(GITHUB_LOGIN_ROUTE);

      done();
    });
  });
});
