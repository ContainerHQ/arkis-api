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

        it('sends an agent unreachable error', done => {
          daemon[action]().then(done).catch(err => {
            expect(err).to.deep.equal(new errors.AgentUnreachableError());
          }).then(done).catch(done);
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

        it(`sends an ${action} request with given attributes`, () => {
          let reqBody;

          mockAPI.post(url, req => {
            reqBody = req.body;
            return { accepted: true };
          });
          return expect(daemon[action](attributes).then(() => {
            expect(reqBody).to.deep.equal(attributes);
          })).to.be.fulfilled;
        });

        it('attaches the proper authorization header to the request', () => {
          let reqHeaders;

          mockAPI.post(url, req => {
            reqHeaders = req.headers;
            return { accepted: true };
          });
          return expect(daemon[action]().then(() => {
            let expected = `JWT ${daemon.node.token || ''}`;

            expect(reqHeaders).to.have.property('authorization', expected);
          })).to.be.fulfilled;
        });

        it('returns the request response', () => {
          let response = _.merge(random.obj(), { accepted: true });

          mockAPI.post(url, () => {
            return response;
          });
          return expect(daemon[action]()).to.eventually.deep.equal(response);
        });

        context('when request is not accepted', done => {
          it('returns an agent locked error', () => {
            mockAPI.post(url, () => {
              return { accepted: false };
            });
            daemon[action]().then(done).catch(err => {
              expect(err).to.deep.equal(new errors.AgentLockedError());
            }).then(done).catch(done);
          });
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
