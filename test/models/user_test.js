'use strict';

describe('User Model', () => {
  db.sync();

  describe('validations', () => {
    it('succeed with valid attributes', () => {
      let user = factory.buildSync('user');

      expect(user.save()).to.be.fulfilled;
    });

    it('fail without email', () => {
      let user = factory.buildSync('user', { email: '' });

      expect(user.save()).to.be.rejected;
    });

    it('fail with invalid email', () => {
      let user = factory.buildSync('user', { email: 'max@furyroad' });

      expect(user.save()).to.be.rejected;
    });

    it('fail without password', () => {
      let user = factory.buildSync('user', { password: '' });

      expect(user.save()).to.be.rejected;
    });

    it('fail with a too short password', () => {
      let user = factory.buildSync('user', { password: _.repeat('*', 5) });

      expect(user.save()).to.be.rejected;
    });

    it('fail with a too long password', () => {
      let user = factory.buildSync('user', { password: _.repeat('*', 129) });

      expect(user.save()).to.be.rejected;
    });

    context('when email is already taken', () => {
      beforeEach(() => {
        return factory.buildSync('user').save();
      });

      it('fail', () => {
        let user = factory.buildSync('user');

        expect(user.save()).to.be.rejected;
      });
    });
  });

  describe('afterCreate', () => {
    let user;

    beforeEach(() => {
      user = factory.buildSync('user');
    });

    it('has a json web token', () => {
      expect(user.save()).to.eventually.satisfy(has.validJWT);
    });

    it('has a hash password', () => {
      expect(user.save())
        .to.eventually.satisfy(has.hashPassword(user.password));
    });
  });

  describe('afterUpdate', () => {
    let user, password;

    beforeEach(() => {
      user = factory.buildSync('user');
      password = user.password;
      return user.save();
    });
    /*
     * We must unsure that the password is not hashed
     * again when the password property is not modified.
     *
     */
    context('without a new password', () => {
      it('has the same hash password', () => {
        expect(user.update({ email: 'azert@gmail.com' }))
          .to.eventually.satisfy(has.hashPassword(password));
      });
    });

    context('with a new password', () => {
      it('has a new hash password', () => {
        let newPassword = 'azertyu';

        expect(user.update({ password: newPassword } ))
          .to.eventually.satisfy(has.hashPassword(newPassword));
      });
    });
  });

  describe('#verifyPassword()', () => {
    let user, password;

    /*
     * The original user password must be kept before hashing.
     */
    beforeEach(() => {
      user = factory.buildSync('user');
      password = user.password;
      return user.save();
    });

    context('when compared password is identical', () => {
      it('returns true', () => {
        expect(user.verifyPassword(password)).to.be.true;
      });
    });

    context('when compared password is different', () => {
      it('returns false', () => {
        expect(user.verifyPassword('')).to.be.false;
      });
    });
  });
});
