'use strict';

let moment = require('moment');

module.exports = function(DataTypes) {
  return {
    attributes: {
      last_state: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'empty',
        validate: { isIn: [['empty', 'deploying', 'upgrading', 'running']] }
      },
      last_ping: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
    },
    options: {
      scopes: {
        state: function(state) {
          if (state === 'unreachable') {
            return { where: {
              last_state: 'running',
              last_ping: {
                $lt: moment().subtract(5, 'minutes').toDate()
              }
            }};
          }
          return { where: {
            last_state: { $like: state || '%' }
          }};
        }
      },
      getterMethods: {
        state: function() {
          let lastPing  = this.getDataValue('last_ping') || moment(),
              lastState = this.getDataValue('last_state');

          if (lastState === 'running' &&
              lastPing < moment().subtract(5, 'minutes')) {
            return 'unreachable';
          }
          return lastState;
        }
      }
    }
  };
};
