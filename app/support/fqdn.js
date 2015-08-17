'use strict';

let fqdn = {};

fqdn.register = function() {
 // if fqdn already registered: update ip
 // if ip already registered: update fqdn
 // else create new entry
};

fqdn.unregister = function() {
  // removes this fqdn/ip combo
};

module.exports = require('../../test/support/fakes/fqdn');
