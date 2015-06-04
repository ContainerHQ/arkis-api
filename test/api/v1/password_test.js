'use strict';

const OLD_PASSWORD = '<3mAgic',
      NEW_PASSWORD = 'lolilol';

describe('PATCH /change_password', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user', { password: OLD_PASSWORD });
    return user.save();
  });

  it('updates the user password', (done) => {
    api
    .changePassword(user)
    .field('old_password', OLD_PASSWORD)
    .field('password', NEW_PASSWORD)
    .field('password_confirmation', NEW_PASSWORD)
    .expect(200)
    .end(expectPassword(user, NEW_PASSWORD, done));
  });

  context('with incorrect old password', () => {
    it('returns an unauthorized status', (done) => {
      api
      .changePassword(user)
      .field('old_password', NEW_PASSWORD)
      .field('password', NEW_PASSWORD)
      .field('password_confirmation', NEW_PASSWORD)
      .expect(401)
      .end(expectPassword(user, OLD_PASSWORD, done));
    });
  });

  context('with invalid password confirmation', () => {
    it('returns a bad request status', (done) => {
      api
      .changePassword(user)
      .field('old_password', OLD_PASSWORD)
      .field('password', NEW_PASSWORD)
      .expect(400)
      .end(expectPassword(user, OLD_PASSWORD, done));
    });
  });

  context('with invalid password', () => {
    it('returns a bad request status', (done) => {
      api
      .changePassword(user)
      .field('old_password', OLD_PASSWORD)
      .expect(400)
      .end((err, res) => {
        expect(res.body).to.be.an('array');
        done();
      });
    });
  });

  function expectPassword(user, password, done) {
    return function(err, res) {
      if (err) return done(err);

      user.reload().then(user => {
        expect(user.verifyPassword(password)).to.be.true
        done();
      }).catch(done);
    };
  }
});
