'use strict';

let _ = require('lodash'),
  models = require('../../app/models');

describe('User Model', () => {
  db.sync();

  describe('validations', () => {
    it('succeed with valid attributes', () => {
      let user = factory.buildSync('user');

      return expect(user.save()).to.be.fulfilled;
    });

    it('succeed with min size password', () => {
      let user = factory.buildSync('user', { password: _.repeat('*', 6) });

      return expect(user.save()).to.be.fulfilled;
    });

    it('succeed with max size password', () => {
      let user = factory.buildSync('user', { password: _.repeat('*', 128) });

      return expect(user.save()).to.be.fulfilled;
    });

    it('fail without email address', () => {
      let user = factory.buildSync('user', { email: '' });

      return expect(user.save()).to.be.rejected;
    });

    it('fail with invalid email address', () => {
      let user = factory.buildSync('user', { email: 'max@furyroad' });

      return expect(user.save()).to.be.rejected;
    });

    it('fail without password', () => {
      let user = factory.buildSync('user', { password: '' });

      return expect(user.save()).to.be.rejected;
    });

    it('fail with a too short password', () => {
      let user = factory.buildSync('user', { password: _.repeat('*', 5) });

      return expect(user.save()).to.be.rejected;
    });

    it('fail with a too long password', () => {
      let user = factory.buildSync('user', { password: _.repeat('*', 129) });

      return expect(user.save()).to.be.rejected;
    });

    context('when email address is already taken', () => {
      const OPTS = { email: 'max@furyroad.io' };

      beforeEach(() => {
        return factory.buildSync('user', OPTS).save();
      });

      it('fails', () => {
        let user = factory.buildSync('user', OPTS);

        return expect(user.validate()).to.eventually.exist;
      });
    });
  });

  describe('#create', () => {
    let user;

    beforeEach(() => {
      user = factory.buildSync('user');
    });

    it('initializes its token', () => {
      return expect(user.save()).to.eventually.satisfy(has.validJWT);
    });

    it('stores its password as a hash', () => {
      return expect(user.save())
        .to.eventually.satisfy(has.hashPassword(user.password));
    });

    it('creates its profile', () => {
      return expect(user.save().then(user => {
        return user.getProfile();
      })).to.eventually.exist;
    });
  });

  describe('#update', () => {
    let user, password;

    /*
     * The original user password must be kept to be sure
     * that the password virtual field has not been updated
     * during saving.
     */
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
        return expect(user.update({ email: 'azert@gmail.com' }))
          .to.eventually.satisfy(has.hashPassword(password));
      });
    });

    context('with a new password', () => {
      it('has a new hash password', () => {
        let newPassword = 'azertyu';

        return expect(user.update({ password: newPassword } ))
          .to.eventually.satisfy(has.hashPassword(newPassword));
      });
    });
  });

  describe('#verifyPassword()', () => {
    let user, password;

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

  describe('#revokeToken()', () => {
    let user;

    beforeEach(() => {
      user = factory.buildSync('user');
      return user.save();
    });

    it('revokes the user token', () => {
      user.revokeToken();

      return expect(user.save()).to.eventually.not.satisfy(has.validJWT);
    });
  });

  describe('#generateToken()', () => {
    let user;

    beforeEach(() => {
      user = factory.buildSync('user');
      return user.save();
    });

    it('generates a new token for the user', () => {
      let previousToken = user.token;

      user.revokeToken();
      user.generateToken();

      return expect(user.save())
        .to.eventually.satisfy(has.validJWT).and
        .not.to.have.property('token', previousToken);
    });
  });
});
