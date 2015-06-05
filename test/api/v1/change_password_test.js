'use strict';

const NEW_PASSWORD = 'asOPJkl,';

describe('PATCH /change_password', () => {
  db.sync();

  let user, currentPassword;

  beforeEach(() => {
    user = factory.buildSync('user');
    currentPassword = user.password;
    return user.save();
  });

  it('updates the user password', (done) => {
    api
    .changePassword(user)
    .field('current_password', currentPassword)
    .field('new_password', NEW_PASSWORD)
    .field('password_confirmation', NEW_PASSWORD)
    .expect(204)
    .end((err, res) => {
      expect(user.reload())
        .to.eventually.satisfy(has.hashPassword(NEW_PASSWORD));
      done();
    });
  });

  context('with incorrect current password', () => {
    it('returns an unauthorized status', (done) => {
      api
      .changePassword(user)
      .field('current_password', `${currentPassword}*`)
      .field('new_password', NEW_PASSWORD)
      .field('password_confirmation', NEW_PASSWORD)
      .expect(401)
      .end((err, res) => {
        expect(res.body.errors).not.to.exist;
        expect(user.reload())
          .to.eventually.satisfy(has.hashPassword(currentPassword));
       done();
      });
    });
  });

  context('with invalid password confirmation', () => {
    it('returns a bad request status', (done) => {
      api
      .changePassword(user)
      .field('current_password', currentPassword)
      .field('new_password', NEW_PASSWORD)
      .expect(400)
      .end((err, res) => {
        expect(res.body.errors).to.exist;
        expect(user.reload())
          .to.eventually.satisfy(has.hashPassword(currentPassword));
        done();
      });
    });
  });

  context('with invalid password', () => {
    it('returns a bad request status', (done) => {
      api
      .changePassword(user)
      .field('current_password', currentPassword)
      .expect(400)
      .end((err, res) => {
        expect(res.body.errors).to.exist;
        expect(user.reload())
          .to.eventually.satisfy(has.hashPassword(currentPassword));
        done();
      });
    });
  });
});
