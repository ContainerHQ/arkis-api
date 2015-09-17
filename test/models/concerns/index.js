'use strict';

module.exports = function(factoryName) {
  return {
    behavesAsAStateMachine: require('./state')(factoryName),
    serializable: require('./serializable')(factoryName),
    validates: require('./validates')(factoryName),
    has: require('./has')(factoryName)
  };
};
