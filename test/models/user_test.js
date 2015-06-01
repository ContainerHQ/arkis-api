var expect = require('chai').expect,
  bcrypt = require('bcrypt'),
  db = require('../support/db'),
  User = require('../../models').User;

const PASSWORD = 'allm8yMax';

describe('User Model', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = User.build({
      email: 'max@furyroad.io',
      password: PASSWORD
    });
  });

  context('when created', () => {
    beforeEach((done) => {
      user.save()
      .then(() => { done() })
      .catch((err) => {
        done(err);
      });
    });

    it('has a hashed password', () => {
      let isHashed = bcrypt.compareSync(PASSWORD, user.password);

      expect(isHashed).to.be.true;
    });

    describe('#verifyPassword()', () => {
      context('when compared password is identical', () => {
        it('returns true', () => {
          expect(user.verifyPassword(PASSWORD)).to.be.true;
        });
      });

      context('when compared password is different', () => {
        it('returns false', () => {
          expect(user.verifyPassword(`${PASSWORD}*`)).to.be.false;
        });
      });
    });

    context('updating this user with a new password', () => {
      const NEW_PASSWORD = 'newpassword';

      beforeEach((done) => {
        user.update({ password: NEW_PASSWORD })
        .then(() => { done() })
        .catch((err) => {
          done(err);
        });
      });

      it('hashes the new password', () => {
        let isHashed = bcrypt.compareSync(NEW_PASSWORD, user.password);

        expect(isHashed).to.be.true;
      });
    });

    context('creating an user with the same email', () => {
      it.skip('fails with a validation error', (done) => {
        User.create({ email: user.email, password: 'azerty' })
        .then(done)
        .catch((err) => {
          expect(err).to.be.an.instanceof(sequelize.ValidationError);
          done();
        });
      });
    });
  });
});
