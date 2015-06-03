'use strict';

var User = require('../../models').User;

const VALID_ATTRIBUTES = { email: 'max@furyroad.ui', password: 'allm8yMax' };

describe('User Model', () => {
  db.sync();

  describe('validations', () => {
    it('fail without email', () => {
      expect(User.create({password:'password'})).to.be.rejected;
    });

    it('fail without password', () => {
      expect(User.create({email:'adrien@gmail.com'})).to.be.rejected;
    });

    it('fail with a too short password', () => {
      expect(User.create({email:'adrien@gmail.com', password: 'a'})).to.be.rejected;
    });

    it('fail with a too long password', () => {
      let password = _.repeat('*', 129);

      expect(User.create({email:'adrien@gmail.com', password: password})).to.be.rejected;
    });

    it('fail with already taken email', () => {
      expect(User.create(VALID_ATTRIBUTES)).to.be.fulfilled;
      expect(User.create(VALID_ATTRIBUTES)).to.be.rejected;
    });

    it('succeed with valid attributes', () => {
      expect(User.create(VALID_ATTRIBUTES)).to.be.fulfilled;
    });
  });

  describe('afterCreate', () => {
    it('has a json web token', () => {
      expect(User.create(VALID_ATTRIBUTES)).to.eventually.satisfy(has.validJWT);
    });


    it('has a hash password', () => {
      expect(User.create(VALID_ATTRIBUTES)).to.eventually.satisfy(has.hashPassword(VALID_ATTRIBUTES.password));
    });
  });

  describe('afterUpdate', () => {
    let user;

    beforeEach(() => {
      user = User.build(VALID_ATTRIBUTES);
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
          .to.eventually.satisfy(has.hashPassword(VALID_ATTRIBUTES.password));
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
    let user;

    beforeEach(() => {
      user = User.build(VALID_ATTRIBUTES);
      return user.save();
    });

    context('when compared password is identical', () => {
      it('returns true', () => {
        expect(user.verifyPassword(VALID_ATTRIBUTES.password)).to.be.true;
      });
    });

    context('when compared password is different', () => {
      it('returns false', () => {
        expect(user.verifyPassword(`${VALID_ATTRIBUTES.password}*`)).to.be.false;
      });
    });
  });
});
