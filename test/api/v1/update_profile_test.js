'use strict';

describe('PATCH /profile', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  it('updates the user profile', (done) => {
    let fullname = 'Uther Lightbringer';

    api
    .updateProfile(user)
    .field('fullname', fullname)
    .expect(204)
    .end((err, res) => {
      if (err) { return done(err); }

      expect(user.getProfile())
        .to.eventually.have.property('fullname', fullname)
        .notify(done);
    });
  });
});
