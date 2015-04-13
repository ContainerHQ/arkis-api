var expect = require('chai').expect,
    rewire = require('rewire'),
    path = require('path'),
    Host = rewire('../../../lib/docker/host');

let fakeFs = { readFileSync: function(path) { return path; } };

const UNIX_SOCKET = '/var/run/docker.sock',
      UNIX_HOST   = `unix://${UNIX_SOCKET}`,
      TCP_HOST    = 'tcp://127.0.0.1:2375',
      HTTP_HOST   = TCP_HOST.replace('tcp', 'http'),
      CERT_PATH   = 'mypath';

describe('Docker Host', () => {
  describe('.new', () => {
    let revertHost;

    before(() => {
      revertHost = Host.__set__('fs', fakeFs);
    });

    after(() => {
      revertHost();
    })

    context('with unix socket address', () => {
      let host = new Host(UNIX_HOST);

      it('has an url formated as http://unix:/absolute/socket.sock:', () => {
        expect(host.url).to.equal(`http://unix:${UNIX_SOCKET}:`);
      });
    });
    
    context('with tcp address', () => {
      let host = new Host(TCP_HOST);

      it('has an http url formated as http://host:port', () => {
        expect(host.url).to.equal(HTTP_HOST);
      });
    });
    
    context('with http address', () => {
      let host = new Host(HTTP_HOST);

      it('has an url equal to this address', () => {
        expect(host.url).to.equal(HTTP_HOST);
      });
    });
    
    context('when not using ssl', () => {
      let host = new Host(TCP_HOST);
      
      it("isn't tls verified", () => {
        expect(host.tlsVerify).to.be.false;
      });

      it("hasn't any ssl certificates", () => {
        expect(host.certs).not.to.exist;
      });
    });
    
    context('when using ssl', () => {
      let host = new Host(TCP_HOST, true, CERT_PATH);
      
      it('is tls verified', () => {
        expect(host.tlsVerify).to.be.true;
      });
  
      it('has an https url', () => {
        expect(host.url.startsWith('https://')).to.be.true;
      });
  
      ['ca', 'cert', 'key'].forEach(cert => {
        it(`has ${cert} ssl certificate`, () => {
          let expected = path.resolve(CERT_PATH, `${cert}.pem`);
  
          expect(host.certs[cert]).to.equal(expected);
        });
      });
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
