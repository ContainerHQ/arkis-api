'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  pem = require('pem'),
  Cert = rewire('../../app/connectors/cert');

const ISSUER = {
  country: 'FR',
  state: 'Ile de France',
  locality: 'Paris',
  organization: 'ContainerHQ',
  organizationUnit: 'IT',
  commonName: 'arkis.io'
};

const ISSUER_EMAIL = 'support@arkis.io',
      LIFESPAN = 10 // In years

describe('Cert Connector', () => {
  describe('.generate', () => {
    let certificate, infos;

    beforeEach(() => {
      return Cert.generate().then(cert => {
        certificate = cert;
      });
    });

    ['server', 'client'].forEach(type => {
      it(`generates a ca signed ${type} certificate`, done => {
        pem.verifySigningChain(certificate[type].cert, certificate.ca, done);
      });

      it(`generates a key signed ${type} certificate`, done => {
        pem.getModulus(certificate[type].cert, (err, res) => {
          if (err) { return done(err); }

          let expected = res.modulus;

          pem.getModulus(certificate[type].key, (err, res) => {
            if (err) { return done(err); }

            expect(res.modulus).to.equal(expected);
            done();
          });
        });
      });
    });

    context('ca certificate informations', () => {
      beforeEach(done => {
        setCertInfos('ca', done);
      });

      hasValidLifespan();
      hasValidIssuer();

      it('has valid options matching issuer', () => {
        expect(infos).to.include(
          _.merge({ emailAddress: ISSUER_EMAIL}, ISSUER)
        );
      });
    });

    context('server certificate informations', () => {
      beforeEach(done => {
        setCertInfos('server', done);
      });

      hasValidLifespan();

      hasCommonName('localhost');

      it('includes san ip 127.0.0.1', () => {
        expect(infos.san.ip).to.include('127.0.0.1');
      });
    });

    context('client certificate informations', () => {
      beforeEach(done => {
        setCertInfos('client', done);
      });

      hasValidLifespan();

      hasCommonName('client');

      it('has no san', () => {
        expect(infos.san).to.not.exist;
      });
    });

    function hasCommonName(value) {
      it(`has commonName equal to ${value}`, () => {
        expect(infos.commonName).to.equal(value);
      });
    }

    function hasValidIssuer() {
      it('has valid issuer', () => {
        expect(infos.issuer).to.deep.equal(ISSUER);
      });
    }

    function hasValidLifespan() {
      it(`has a ${LIFESPAN} years lifespan`, () => {
        let { start, end } = infos.validity;

        expect(moment(start).fromNow()).to.equal('a few seconds ago');
        expect(moment(end).fromNow()).to.equal(`in ${LIFESPAN} years`);
      });
    }

    function setCertInfos(type, done) {
      let cert = type === 'ca' ? certificate[type] : certificate[type].cert;

      pem.readCertificateInfo(cert, (err, res) => {
        if (err) { return done(err); }

        infos = res;
        done();
      });
    }
  });
});
