var expect = require('chai').expect,
  bcrypt = require('bcrypt'),
  db = require('../../support/db'),
  api = require('../../support/api');

const OLD_PASSWORD = '<3mAgic',
      NEW_PASSWORD = 'lolilol';

db.sync();

let getUser = db.createUser({
  email: 'harry@hogwarts.com',
  password: OLD_PASSWORD
});

describe('POST /change_password', () => {
  it('updates the user password', (done) => {
    let user = getUser();

    api
    .changePassword(getUser())
    .field('old_password', OLD_PASSWORD)
    .field('password', NEW_PASSWORD)
    .field('password_confirmation', NEW_PASSWORD)
    .expect(200)
    .end(validatePassword(user, NEW_PASSWORD, done));
  });

  context('with incorrect old password', () => {
    it('returns an unauthorized status', (done) => {
      let user = getUser();

      api
      .changePassword(getUser())
      .field('old_password', NEW_PASSWORD)
      .field('password', NEW_PASSWORD)
      .field('password_confirmation', NEW_PASSWORD)
      .expect(401)
      .end(validatePassword(user, OLD_PASSWORD, done));
    });
  });

  context('with incorrect password confirmation', () => {
    it('returns a bad request status', (done) => {
      let user = getUser();

      api
      .changePassword(getUser())
      .field('old_password', OLD_PASSWORD)
      .field('password', NEW_PASSWORD)
      .field('password_confirmation', OLD_PASSWORD)
      .expect(400)
      .end(validatePassword(user, OLD_PASSWORD, done));
    });
  });

  context('with invalid password', () => {
    it('returns a bad request status', (done) => {
      let user = getUser();

      api
      .changePassword(getUser())
      .field('old_password', OLD_PASSWORD)
      .expect(400)
      .end((err, res) => {
        expect(res.body).to.be.an('array');
        done();
      });
    });
  });

  function validatePassword(user, password, done) {
    return function(err, res) {
      if (err) return done(err);

      user.reload().then(user => {
        expect(user.verifyPassword(password)).to.be.true
        done();
      }).catch(done);
    };
  }
});
