'use strict';

var User = require('../../../app/models').User;

const NEW_EMAIL = 'new.email@arkis.io';

describe('PATCH /change_email', () => {
  db.sync();

  let user, currentEmail, currentPassword;

  beforeEach(() => {
    user = factory.buildSync('user');
    currentEmail = user.currentEmail;
    currentPassword = user.password;
    return user.save();
  });

  it('updates the user email', done => {
    api
    .changeEmail(user)
    .field('current_password', currentPassword)
    .field('email', NEW_EMAIL)
    .expect(204)
    .end((err, res) => {
      if (err) { return done(err); }

      expect(user.reload())
        .to.eventually.have.property('email', NEW_EMAIL)
        .notify(done);
    });
  });

  context('with incorrect current password', () => {
    it('returns an unauthorized status', done => {
      api
      .changeEmail(user)
      .field('current_password', `${currentPassword}*`)
      .expect(401)
      .end((err, res) => {
        if (err) { return done(err); }

        expect(user.reload())
          .to.eventually.have.property('email', currentEmail)
          .notify(done);
      });
    });
  });

  context('with invalid email address', () => {
    it('returns a bad request status and errors', done => {
      api
      .changeEmail(user)
      .field('current_password', currentPassword)
      .field('email', '*')
      .expect(400)
      .end((err, res) => {
        if (err) { return done(err); }

        expect(user.reload())
          .to.eventually.have.property('email', currentEmail)
          .notify(done);
      });
    });
  });

  context('with forbidden attributes', () => {
    let attributes, reference;

    beforeEach(() => {
      attributes = _.difference(user.attributes,
        ['id', 'email', 'created_at', 'updated_at']
      );
      reference = factory.buildSync('forbiddenUser');
    });

    it('these attributes are filtered', done => {
      api.callWithAttributes(attributes, reference,
        api.changeEmail(user)
      )
      .field('current_password', currentPassword)
      .field('email', NEW_EMAIL)
      .expect(204)
      .end((err, res) => {
        if (err) { return done(err); }

        expect(User.findById(user.id))
          .to.eventually.satisfy(has.beenFiltered(user, attributes))
          .notify(done);
      });
    });
  });
});
