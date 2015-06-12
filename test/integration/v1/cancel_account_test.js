'use strict';

let User = require('../../../app/models').User;

describe('DELETE /account/cancel', () => {
  db.sync();

  let user, password;

  beforeEach(() => {
    user = factory.buildSync('user');
    password = user.password;
    return user.save();
  });

  it('destroys the user account', done => {
    api.account(user).cancel()
    .field('password', password)
    .expect(204)
    .end((err, res) => {
      if (err) { return done(err); }

      expect(User.findOne({ where: { email: user.email } }))
        .to.eventually.be.null
        .notify(done);
    });
  });

  context('with incorrect password', () => {
    it('returns a forbidden status', done => {
      api.account(user).cancel()
      .field('password', `${password}*`)
      .expect(403)
      .end((err, res) => {
        if (err) { return done(err); }

        expect(User.findOne({ where: { email: user.email } }))
          .not.to.eventually.be.null
          .notify(done);
      });
    });
  });
});
