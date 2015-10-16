'use strict';

let concerns = require('./concerns');

describe('UserProviderLink Model', () => {
  db.sync();

  concerns('userProviderLink').validates({
    type: {
      presence: true,
      inclusion: ['ssh_key']
    }
  });
});
