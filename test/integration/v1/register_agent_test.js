'use strict';

let _ = require('lodash'),
  Node = require('../../../app/models').Node;

describe('PATCH /agent/:token/register', () => {
  db.sync();

  context('when the node exists', () => {
    let node;

    beforeEach(() => {
      node = factory.buildSync('node');
      return node.save();
    });

    it('updates the node infos sent by the agent', done => {
      let form = { public_ip: '123.1.12.3',
        docker_version: '0.0.0',
        swarm_version:  '0.0.0'
      };

      api.agent(node.token).register(form)
      .expect(204, (err, res) => {
        if (err) { return done(err); }

        node.reload().then(() => {
          expect(node).to.include(form)
            .and.to.have.property('state', 'running');
          done();
        }).catch(done);
      });
    });

    context('with invalid attributes', () => {
      it('responds with a bad request status and validation errors', done => {
        let form = { public_ip: '.' };

        api.agent(node.token).register(form)
        .expect(400, (err, res) => {
          if (err) { return done(err); }

          expect(node.register(form))
            .to.be.rejectedWith(res.body.errors)
            .notify(done);
        });
      });
    });

    context('with blacklisted attributes', () => {
      let attributes, form;

      /*
       * last_state is automatically set to running and therefore is
       * ignored in this test.
       */
      beforeEach(() => {
        attributes = _.difference(node.attributes,
          [
            'public_ip', 'docker_version', 'swarm_version', 'last_state',
            'id', 'containers_count', 'created_at', 'updated_at'
          ]
        );
        form = factory.buildSync('forbiddenNode').dataValues;
      })

      it('these attributes are filtered', done => {
        api.agent(node.token).register(form)
        .expect(204, (err, res) => {
          if (err) { return done(err); }

          expect(Node.findById(node.id))
            .to.eventually.satisfy(has.beenFiltered(node, attributes))
            .notify(done);
        });
      });
    });

  });

  context("when the node doesn't exist", () => {
    it('returns a 404 not found', done => {
      api.agent().register().expect(404, {}, done);
    });
  });
});
