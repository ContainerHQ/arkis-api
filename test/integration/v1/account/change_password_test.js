'use strict';

let _ = require('lodash'),
  User = require('../../../../app/models').User;

const NEW_PASSWORD = 'asOPJkl,';

describe('PATCH /account/change_password', () => {
  db.sync();
  db.create(['user']);

  let user, oldPassword;

  beforeEach(() => {
    user = factory.buildSync('user');
    oldPassword = user.password;
    return user.save();
  });

  it('updates the user password', done => {
    api.account(user).changePassword()
    .field('old_password', oldPassword)
    .field('new_password', NEW_PASSWORD)
    .field('new_password_confirmation', NEW_PASSWORD)
    .expect(204, (err, res) => {
      if (err) { return done(err); }

      expect(user.reload())
        .to.eventually.satisfy(has.hashPassword(NEW_PASSWORD))
        .notify(done);
    });
  });

  context('with incorrect old password', () => {
    it('returns a forbidden status', done => {
      api.account(user).changePassword()
      .field('old_password', `${oldPassword}*`)
      .field('new_password', NEW_PASSWORD)
      .field('new_password_confirmation', NEW_PASSWORD)
      .expect(403, (err, res) => {
        if (err) { return done(err); }

        expect(user.reload())
          .to.eventually.satisfy(has.hashPassword(oldPassword))
          .notify(done);
      });
    });
  });

  context('with invalid password confirmation', () => {
    it('returns a bad request status and validation errors', done => {
      api.account(user).changePassword()
      .field('old_password', oldPassword)
      .field('new_password', NEW_PASSWORD)
      .expect(400, (err, res) => {
        if (err) { return done(err); }

        expect(res.body.errors).to.exist;
        expect(user.reload())
          .to.eventually.satisfy(has.hashPassword(oldPassword))
          .notify(done);
      });
    });
  });

  context('with invalid password', () => {
    it('returns a bad request status and validation errors', done => {
      api.account(user).changePassword()
      .field('old_password', oldPassword)
      .expect(400, (err, res) => {
        if (err) { return done(err); }

        user.update({ password: null }).then(done).catch(err => {
          expect(res.body).to.deep.equal(format.error(err));
        }).then(done).catch(done);
      });
    });
  });

  /*
   * We can safely assume that if the password_hash is not filtered,
   * the test wich ensure that the password has been changed won't work.
   *
   * Therefore, the password_hash is added to the whitelist of this test.
   */
  context('with blacklisted attributes', () => {
    let attributes, form;

    beforeEach(() => {
      attributes = _.difference(user.attributes,
        ['password', 'password_hash', 'id', 'created_at', 'updated_at']
      );
      form = factory.buildSync('forbiddenUser').dataValues;
    });

    it('these attributes are filtered', done => {
      api.account(user).changePassword()
      .send(form)
      .field('old_password', oldPassword)
      .field('new_password', NEW_PASSWORD)
      .field('new_password_confirmation', NEW_PASSWORD)
      .expect(204, (err, res) => {
        if (err) { return done(err); }

        expect(User.findById(user.id))
          .to.eventually.satisfy(has.beenFiltered(user, attributes, false))
          .notify(done);
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.account().changePassword().expect(401, done);
    });
  });
});
