var expect = require('chai').expect,
    Host = require('../../../lib/docker/host');

const UNIX_SOCKET = '/var/run/docker.sock',
      UNIX_HOST   = `unix://${UNIX_SOCKET}`,
      TCP_HOST    = 'tcp://127.0.0.1:2375',
      HTTP_HOST   = TCP_HOST.replace('tcp', 'http');

describe('Docker Host', () => {
  describe('.new', () => {
    context('with unix socket address', () => {
      let host = new Host(UNIX_HOST);

      it('has an url formated as http://unix:/absolute/socket.sock:', () => {
        expect(host.url).to.equal(`http://unix:${UNIX_SOCKET}:`);
      });

      context('when using ssl', () => {
        let host = new Host(UNIX_HOST, true);

        it('has a unix https url', () => {
          expect(host.url).to.equal(`https://unix:${UNIX_SOCKET}:`);
        });
      });
    });

    context('with tcp address', () => {
      let host = new Host(TCP_HOST);

      it('has an http url formated as http://host:port', () => {
        expect(host.url).to.equal(HTTP_HOST);
      });

      context('when using ssl', () => {
        let host = new Host(TCP_HOST, true);

        it('has an https url formated as https://host:port', () => {
          let expected = TCP_HOST.replace('tcp', 'https');

          expect(host.url).to.equal(expected);
        });
      });
    });

    context('with http address', () => {
      let host = new Host(HTTP_HOST);

      it('has an url equal to this address', () => {
        expect(host.url).to.equal(HTTP_HOST);
      });
    });
  });
});
