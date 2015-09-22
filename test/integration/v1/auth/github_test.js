'use strict';

const GITHUB_LOGIN_ROUTE = 'https://github.com/login/oauth/authorize';

describe('GET /auth/github', () => {
  db.sync();
  db.create('user');

  it('redirects the user to github authentication form', done => {
    api.auth.github()
    .expect(302)
    .expect('location', new RegExp(`^${GITHUB_LOGIN_ROUTE}`), done);
  });
});
