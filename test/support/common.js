'use strict';

let chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiSubset = require('chai-subset'),
  sinonChai = require('sinon-chai'),
  chaiString = require('chai-string');

chai.use(chaiAsPromised);
chai.use(chaiSubset);
chai.use(sinonChai);
chai.use(chaiString);

global.chai = chai;
global.expect = chai.expect;
global.sinon = require('sinon');
global.rewire = require('rewire');
global.db = require('./db');
global.factory = require('./factories');
global.api = require('./api');
global.has = require('./matchers');
global.format = require('./format');
global.random = require('./random');
