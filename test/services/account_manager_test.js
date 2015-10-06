'use strict';

let _ = require('lodash'),
  models = require('../../app/models'),
  errors = require('../../app/support').errors,
  services = require('../../app/services');

describe('AccountManager Service', () => {
  let user, manager;

  beforeEach(() => {
    user    = factory.buildSync('user');
    manager = new services.AccountManager(user);
  });

  describe('.constructor', () => {
    it('creates a provider manager for the user', () => {
      expect(manager.provider.user).to.equal(manager.user);
    });
  });

  describe('#getClusterManagers', () => {
    beforeEach(() => {
      return manager.user.save();
    });

    context('when user has clusters', () => {
      beforeEach(done => {
        let opts = { user_id: manager.user.id };

        factory.createMany('cluster', opts, 7, done);
      });

      it("returns all user's ClusterManager", () => {
        let expected;

        return manager.user.getClusters().then(clusters => {
          expected = _.map(clusters, cluster => {
            return new services.ClusterManager(cluster);
          });
          return manager.getClusterManagers();
        }).then(managers => {
          return expect(managers).to.deep.equal(expected);
        });
      });
    });

    context('when user has no cluster', () => {
      it('returns an empty list', () => {
        return manager.getClusterManagers().then(managers => {
          return expect(managers).to.be.empty;
        });
      });
    });
  });

  describe('#register', () => {
    context('when provider link succeeded', ()=> {
      beforeEach(() => {
        return manager.register();
      });

      it('creates the user', () => {
        return expect(manager.user.reload())
          .to.eventually.have.property('isNewRecord').to.be.false;
      });

      it('creates a user profile', () => {
        return expect(manager.user.getProfile())
          .to.eventually.exist;
      });
    });

    context('when provider link failed', ()=> {
      let actualErr, expectedErr;

      beforeEach(done => {
        expectedErr = random.error();
        manager.provider.link = sinon.stub().returns(
          Promise.reject(expectedErr)
        );
        manager.register().then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      it("doens't create the user", () => {
        return expect(manager.user.reload()).to.be.rejected;
      });

      it("dosen't create a user profile", () => {
        return expect(manager.user.getProfile())
          .to.eventually.not.exist;
      });

      it('returns the error', () => {
        expect(actualErr).to.deep.equal(expectedErr);
      });
    });

  });

  describe('#destroy', () => {
    let userId, profileId;

    beforeEach(() => {
      return manager.register().then(() => {
        userId = manager.user.id;
        return manager.user.getProfile();
      }).then(profile => {
        profileId = profile.id;
      });
    });

    context('when user has no cluster', () => {
      beforeEach(() => {
        return manager.destroy();
      });

      itRemovesTheUser();
      itRemovesTheUserProfile();
    });

    context('when user has some clusters', () => {
      const CLUSTER_COUNT = 6;

      let clusters;

      beforeEach(done => {
        let opts = { user_id: userId };

        factory.createMany('cluster', opts, CLUSTER_COUNT,
        (err, userClusters) => {
          clusters = userClusters;
          done(err);
        });
      });

      context('when these clusters are deletable', () => {
        beforeEach(() => {
          return manager.destroy();
        });

        itRemovesTheUser();
        itRemovesTheUserProfile();
        itRemovesTheUserClusters();
      });

      context('when one user cluster is undeletable', () => {
        let actualErr, undeletableCluster, clusterErr;

        beforeEach(done => {
          undeletableCluster = clusters[
            random.integer({ min: 0, max: CLUSTER_COUNT - 1 })
          ];
          clusterErr = random.error();
          undeletableCluster.destroy = () => {
            return Promise.reject(clusterErr);
          };
          manager.getClusterManagers = () => {
            return Promise.resolve(_.map(clusters, cluster => {
              return new services.ClusterManager(cluster);
            }));
          };
          manager.destroy().then(done).catch(err => {
            actualErr = err;
          }).then(done).catch(done);
        });

        itDoesntRemoveTheUser();
        itDoesntRemoveTheUserProfile();

        it('removes every deletable user clusters', () => {
          _.pull(clusters, undeletableCluster);

          let criterias = { where: { id: _.pluck(clusters, 'id') } };

          return expect(models.Cluster.findAll(criterias))
            .to.eventually.be.empty;
        });

        it('it returns an errors with user cluster deletion errors', () => {
          let expected = new errors.DeletionError([{
            name: clusterErr.name,
            message: clusterErr.message,
            resource: 'cluster',
            resource_id: undeletableCluster.id
          }]);

          expect(actualErr).to.deep.equal(expected);
        });
      });

      context("when provider can't be unlinked", () => {
        let actualErr, expectedErr;

        beforeEach(done => {
          manager.provider.unlink = sinon.stub().returns(
            Promise.reject(expectedErr = random.error())
          );
          manager.destroy().then(done).catch(err => {
            actualErr = err;
            done();
          });
        });

        itDoesntRemoveTheUser();
        itDoesntRemoveTheUserProfile();
        itRemovesTheUserClusters();

        it('returns the error', () => {
          return expect(actualErr).to.deep.equal(expectedErr);
        });
      });

      function itRemovesTheUserClusters() {
        it('removes the user clusters', () => {
          let criterias = { where: { id: _.pluck(clusters, 'id') } };

          return expect(models.Cluster.findAll(criterias))
            .to.eventually.be.empty;
        });
      }
    });

    function itRemovesTheUser() {
      it('removes the user', () => {
        return expect(models.User.findById(userId)).to.eventually.not.exist;
      });
    }

    function itDoesntRemoveTheUser() {
      it("doesn't remove the user", () => {
        return expect(models.User.findById(userId)).to.eventually.exist;
      });
    }

    function itRemovesTheUserProfile() {
      it('removes the user profile', () => {
        return expect(models.Profile.findById(profileId))
          .to.eventually.not.exist;
      });
    }

    function itDoesntRemoveTheUserProfile() {
      it("doesn't remove the user profile", () => {
        return expect(models.Profile.findById(profileId)).to.eventually.exist;
      });
    }
  });
});
