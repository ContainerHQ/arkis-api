'use strict';

let _ = require('lodash'),
  User = require('../../../../app/models').User;

const NEW_EMAIL = 'new.email@arkis.io';

describe('PATCH /account/change_email', () => {
  db.sync();

  let user, oldEmail, password;

  beforeEach(() => {
    user = factory.buildSync('user');
    oldEmail = user.oldEmail;
    password = user.password;
    return user.save();
  });

  it('updates the user email', done => {
    api.account(user).changeEmail()
    .field('password', password)
    .field('new_email', NEW_EMAIL)
    .expect(204, (err, res) => {
      if (err) { return done(err); }

      expect(user.reload())
        .to.eventually.have.property('email', NEW_EMAIL)
        .notify(done);
    });
  });

  context('with incorrect current password', () => {
    it('returns a forbidden status', done => {
      api.account(user).changeEmail()
      .field('password', `${password}*`)
      .expect(403, (err, res) => {
        if (err) { return done(err); }

        expect(user.reload())
          .to.eventually.have.property('email', oldEmail)
          .notify(done);
      });
    });
  });

  context('with invalid email address', () => {
    it('returns a bad request status and validation errors', done => {
      api.account(user).changeEmail()
      .field('password', password)
      .expect(400, (err, res) => {
        if (err) { return done(err); }

        expect(user.reload())
          .to.eventually.have.property('email', oldEmail)
          .notify(done);
      });
    });
  });

  context('with blacklisted attributes', () => {
    let attributes, form;

    /*
     * The password can be ignored here, we already ensure
     * that the password field is used to verify the user
     * password.
     */
    beforeEach(() => {
      attributes = _.difference(user.attributes,
        ['id', 'email', 'password', 'created_at', 'updated_at']
      );
      form = factory.buildSync('forbiddenUser').dataValues;
    });

    it('these attributes are filtered', done => {
      api.account(user).changeEmail()
      .send(form)
      .field('password', password)
      .field('new_email', NEW_EMAIL)
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
      api.account().changeEmail().expect(401, done);
    });
  });
});
