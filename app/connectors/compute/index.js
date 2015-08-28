'use strict';

let providers = {
  DigitalOcean: require('./digital_ocean')
};

class Compute {
  static default(credentials={}) {
    return new providers.DigitalOcean(credentials);
  }
}

module.exports = Compute;
