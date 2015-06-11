'use strict';

describe('PATCH /account/profile', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  it('updates the user profile', done => {
    let fullname = 'Uther Lightbringer';

    api.account.updateProfile(user)
    .field('fullname', fullname)
    .expect(200)
    .end((err, res) => {
      if (err) { return done(err); }

      let profile = format.timestamps(res.body.profile);

      expect(user.getProfile())
        .to.eventually.have.property('dataValues')
        .that.deep.equals(profile).and
        .that.have.property('fullname', fullname)
        .notify(done);
    });
  });

  context('with invalid attributes', done => {

  });
});
