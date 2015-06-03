'use strict';

describe('/profile', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  describe('GET', () => {
    it('returns the user profile', (done) => {
      api
      .profile(user)
      .expect(200)
      .end(done);
    });

    context('when API token is incorrect', () => {
      beforeEach(() => {
        user.token += '*';
      });

      it('returns an unauthorized status', (done) => {
        api
        .profile(user)
        .expect(401, {}, done);
      });
    });
  });

  describe('POST', () => {
    it('updates the user profile', () => {

    });
  });
});
