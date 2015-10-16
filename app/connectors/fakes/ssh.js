'use strict';

class SSH {
  static generateKey() {
    return Promise.resolve({ public: 'a', private: 'b' });
  }
}

module.exports = SSH;
