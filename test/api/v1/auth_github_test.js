'use strict';

const GITHUB_LOGIN_ROUTE = 'https://github.com/login/oauth/authorize';

describe('GET /auth/github', () => {
  it('redirect the user to github auth', (done) => {
    api
    .authGitHub()
    .expect(302)
    .expect('location', new RegExp(`^${GITHUB_LOGIN_ROUTE}`), done);
  });
});
