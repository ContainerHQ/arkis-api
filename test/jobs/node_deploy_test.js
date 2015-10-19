'use strict';

let AccountManager = require('../../app/services').AccountManager,
  jobs = require('../../app/jobs');

describe('Node Deploy Job', () => {
  let user, cluster, node, action, nodeDeploy;

  beforeEach(() => {
    user = factory.buildSync('user');

    return new AccountManager(user).register().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    }).then(() => {
      node = factory.buildSync('node', {
        cluster_id: cluster.id,
        region: 'sf2',
        size: '10gb'
      });
      return node.save();
    }).then(() => {
      action = factory.buildSync('action', {
        type: 'deploy', resource: 'node', resource_id: node.id
      });
      return action.save();
    }).then(() => {
      nodeDeploy = new jobs.NodeDeploy(action);
    });
  });

  describe('#create', () => {
    let job;

    beforeEach(() => {
      job = nodeDeploy.create();
    });

    it('creates a node deploy job', () => {
      expect(job.type).to.equal('node-deploy');
    });

    it('binds the action id to the job', () => {
      expect(job.data.action_id).to.equal(action.id);
    });
  });

  describe('#process', () => {
    beforeEach(done => {
      let job = nodeDeploy.create();

      job.on('complete', done);
      job.on('failed',   done);
    });

    it('creates a machine and saves the provider id on the node', () => {
      return expect(node.reload())
        .to.eventually.have.property('provider_id').that.is.not.null;
    });

    it('creates a node provision job binded to the same action', done => {
      nodeDeploy.queue.active((err, ids) => {
        console.log(ids);
        done(err);
      });
    });


    context('machine creation failed', () => {
      // put action in state error, log the error on the action (
      // make an instance method for that on ActionJob
      //
    )
    });

    // use array
    context('when action, cluster, user, node has been deleted', () => {

    });
  })
});
