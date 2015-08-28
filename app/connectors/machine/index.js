'use strict';

let providers = {
  DigitalOcean: require('./digital_ocean')
};

class Machine {
  static default(credentials={}) {
    return new providers.DigitalOcean(credentials);
  }
}

module.exports = Machine;
