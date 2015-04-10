var expect = require('chai').expect,
    rewire = require('rewire'),
    path = require('path'),
    Host = rewire('../../../lib/docker/host');

const UNIX_SOCKET = '/var/run/docker.sock',
      CERT_PATH   = 'mypath',
      TCP_HOST    = 'tcp://127.0.0.1:2375',
      UNIX_HOST   = `unix://${UNIX_SOCKET}`;

Host.__set__('fs', { readFileSync: function(path) { return path; } });

describe('Docker Host', () => {
  context('with tcp address', () => {
    let host = new Host(TCP_HOST);

    it('has an http url', () => {
      expect(host.url.startsWith('http://')).to.be.true;
    });

    it("isn't tsl verified", () => {
      expect(host.tlsVerify).to.be.false;
    });

    it("hasn't any ssl certificates", () => {
      expect(host.certs).to.be.undefined;
    });
  });

  context('with unix socket address', () => {
    let host = new Host(UNIX_HOST);

    it('has an url following request format', () => {
      let expected = `http://unix:${UNIX_SOCKET}:`;

      expect(host.url).to.equal(expected);
    });
  });

  context('when using ssl', () => {
    let host = new Host(TCP_HOST, true, CERT_PATH);

    it('is tsl verified', () => {
      expect(host.tlsVerify).to.be.true;
    });

    it('has an https url', () => {
      expect(host.url.startsWith('https://')).to.be.true;
    });

    for (let cert of ['ca', 'cert', 'key']) {
      it(`has ${cert} ssl certificate`, () => {
        let expected = path.resolve(CERT_PATH, `${cert}.pem`);

        expect(host.certs[cert]).to.equal(expected);
      });
    }
  });

  describe('.default', () => {
    let expectedHost = new Host(
      process.env.DOCKER_HOST || UNIX_HOST,
      !!process.env.DOCKER_TLS_VERIFY,
      process.env.DOCKER_CERT_PATH
    );

    let host = Host.default();

    it('returns a new host using DOCKER_HOST env var', () => {
      expect(host.url).to.equal(expectedHost.url);
    });

    it('returns a new host using DOCKER_TLS_VERIFY env var', () => {
      expect(host.tlsVerify).to.equal(expectedHost.tlsVerify);
    });

    it('returns a new host using DOCKER_CERT_PATH env var', () => {
      expect(host.certs).to.deep.equal(expectedHost.certs);
    });
  });
});
