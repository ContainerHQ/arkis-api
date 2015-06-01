var expect = require('chai').expect,
  sequelize = require('sequelize'),
  bcrypt = require('bcrypt'),
  User = require('../../models').User;

const PASSWORD = 'allm8yMax';

describe('User Model', () => {

  let user = User.build({
    email: 'max@furyroad.com',
    password: PASSWORD
  });

  context('when email is invalid', () => {
    let user = User.build({
      email: 'lol',
      password: PASSWORD
    });

    it('creation failed', (done) => {
      user.save()
      .then('Creation succeeded but it should not.')
      .catch((err) => {
        expect(err).to.be.an.instanceof(sequelize.ValidationError);
        done();
      });
    });
  });

  // Verify validations with a list of fixtures

  context('when not created', () => {
    it('has no hashed password', () => {
      expect(user.password).to.equal(PASSWORD);
    });
  });

  context('when created', () => {
    before((done) => {
      user.save()
      .then(() => { done() })
      .catch((err) => {
        done(err);
      });
    });

    after((done) => {
      user.destroy()
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

      before((done) => {
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
      it('fails with a validation error', (done) => {
        User.create({ email: user.email, password: 'azerty' })
        .then('Creation succeeded but it should not.')
        .catch((err) => {
          expect(err).to.be.an.instanceof(sequelize.ValidationError);
          done();
        });
      });
    });
  });
});
