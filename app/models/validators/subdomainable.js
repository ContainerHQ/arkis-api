'use strict';

module.exports = {
  len: [1, 32],
  is: {
    args: ['^[a-z0-9\-]+$', 'i'],
    msg: 'Must contain only a-z, 0-9, -'
  },
  isNotStartingWithHypen: function(str) {
    if (str.startsWith('-')) {
      throw new Error('Must not start with a -.');
    }
  },
  isNotEndingWithHypen: function(str) {
    if (str.endsWith('-')) {
      throw new Error('Must not end with a hypen.');
    }
  }
};
