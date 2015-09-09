'use strict';

module.exports = function(factoryName) {
  return {
    behavesAsAStateMachine: require('./state')(factoryName),
    hasSubdomainable: require('./subdomainable')(factoryName),
    serializable: require('./serializable')(factoryName)
  };
};
