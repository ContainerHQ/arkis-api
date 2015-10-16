'use strict';

let config = require('../../config');

let dir = config.useFakes ? './fakes' : '.';

module.exports = {
  Machine: require(`${dir}/machine`),
  Daemon:  require(`${dir}/daemon`),
  SSH:     require(`${dir}/ssh`),
  Cert:    require(`${dir}/cert`)
};
