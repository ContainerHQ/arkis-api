'use strict';

var chai = require('chai'),
  chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

global.chai = chai;
global.expect = chai.expect;
global._ = require('lodash');
global.db = require('./db');
global.factory = require('../factories');
global.api = require('./api');
global.has = require('./matchers');
