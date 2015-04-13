var expect = require('chai').expect,
    rewire = require('rewire'),
    path = require('path'),
    Host = rewire('../../../lib/docker/host');

const UNIX_SOCKET = '/var/run/docker.sock',
      CERT_PATH   = 'mypath',
      TCP_HOST    = 'tcp://127.0.0.1:2375',
      UNIX_HOST   = `unix://${UNIX_SOCKET}`;

let fakeFs = { readFileSync: function(path) { return path; } };

describe('Docker Host', () => {
  describe('.new', () => {
    let revertFs;

    before(() => {
      revertFs = Host.__set__('fs', fakeFs);
    });

    after(() => {
      revertFs();
    })

    context('with unix socket address', () => {
      let host;

      before(() => {
        host = new Host(UNIX_HOST);
      });

      it('has an url with format http://unix:/socket/path/socket.sock:', () => {
        let expected = `http://unix:${UNIX_SOCKET}:`;

        expect(host.url).to.equal(expected);
      });
    });

    context('when not using ssl', () => {
      let host;

      before(() => {
        host = new Host(TCP_HOST);
      });

      it('has an http url', () => {
        expect(host.url.startsWith('http://')).to.be.true;
      });

      it("isn't tsl verified", () => {
        expect(host.tlsVerify).to.be.false;
      });

      it("hasn't any ssl certificates", () => {
        expect(host.certs).not.to.exist;
      });
    });

    context('when using ssl', () => {
      let host;

      before(() => {
        host = new Host(TCP_HOST, true, CERT_PATH);
      });

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
  });

  describe('.default', () => {
    let host = Host.default();

    it('has a url according to docker parameters', () => {
      expect(host.url).to.be.a('string');
    });

    it('has tls verify according to docker parameters', () => {
      expect(host.tlsVerify).to.equal(!!process.env.DOCKER_TLS_VERIFY);
    });

    it('has ssl cerificates according to docker parameters', () => {
      if (host.tlsVerify) {
        return expect(host.certs).to.exist;
      }
      expect(host.certs).not.to.exist;
    });
  });
});
