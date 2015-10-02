'use strict';

let _ = require('lodash'),
  config = require('../../config'),
  errors = require('../../app/support').errors,
  Daemon = rewire('../../app/connectors/daemon');

describe('Daemon Connector', () => {
  let daemon;

  beforeEach(() => {
    return factory.buildSync('registeredNode').save().then(node => {
      daemon = new Daemon(node);
    });
  });

  ['update', 'upgrade'].forEach(action => {
    describe(`#${action}`, () => {
      let attributes, url;

      beforeEach(() => {
        attributes = random.obj();
        url = getURL(action);
      });

      context('when agent api is unreachable', () => {
        let revert;

        beforeEach(() => {
          revert = Daemon.__set__('config', {
            agent: { timeout: 1, ports: { api: 2374 } }
          });
        });

        afterEach(() => {
          revert();
        });

        it('sends an agent error', done => {
          daemon[action]().then(done).catch(err => {
            expect(err.name).to.equal('AgentUnprocessableError');
            done();
          });
        });
      });

      context('when agent api can be reached', () => {
        let mockAPI;

        before(() => {
          mockAPI = require('superagent-mocker')(
            Daemon.__get__('request')
          );
          mockAPI.clearRoutes();
        });

        /*
         * This is a dirty hack but it seems to be the only way to remove
         * the mock as superagent-mocker library is monkey patching directly
         * the superagent singleton.
         */
        after(() => {
          delete require.cache[require.resolve('superagent')];

          Daemon.__set__('request', require('superagent'));
        });

        it(`sends an ${action} request with given attributes`, done => {
          mockAPI.post(url, req => {
            expect(req.body).to.deep.equal(attributes);
            done();
          });
          daemon[action](attributes).catch(done);
        });

        it('attaches the proper authorization header to the request', done => {
          mockAPI.post(url, req => {
            let expected = `JWT ${daemon.node.token || ''}`;

            expect(req.headers).to.have.property('authorization', expected);
            done();
          });
          daemon[action]().catch(done);
        });

        it('returns the request response', () => {
          let response = random.obj();

          mockAPI.post(url, req => {
            return response;
          });
          return expect(daemon[action]()).to.eventually.deep.equal(response);
        });
      });
    });

    function getURL(action) {
      let addr = daemon.node.public_ip  || '.',
          port = config.agent.ports.api || '.';

      return `https://${addr}:${port}/${action}`;
    }
  });
});
