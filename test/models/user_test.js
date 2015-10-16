'use strict';

let _ = require('lodash'),
  concerns = require('./concerns'),
  support = require('../../app/support'),
  connectors = require('../../app/connectors'),
  models = require('../../app/models');

describe('User Model', () => {
  db.sync();

  concerns('user').validates({
    email: {
      presence: true,
      is: 'email',
      uniqueness: { type: 'email' }
    },
    password: {
      presence: true,
      length: { min: 6, max: 128, convert: true }
    }
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

    it('stores its token as a encrypted text', () => {
      return expect(user.save()).to.eventually.satisfy(
        has.encrypted('token', { algorithm: 'aes' })
      );
    });

    it('inializes its ssh key', () => {
      let revert = connectors.SSH.generateKey,
        key = { public: random.string(), private: random.string() };

      connectors.SSH.generateKey = () => {
        return Promise.resolve(key);
      };
      return user.save().then(() => {
        connectors.SSH.generateKey = revert;

        return expect(user.ssh_key).to.deep.equal(key);
      });
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
      user     = factory.buildSync('user');
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
      user     = factory.buildSync('user');
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
