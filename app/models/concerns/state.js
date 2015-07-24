'use strict';

let moment = require('moment');

/*
 * Ping expiration time (in minutes).
 */
const PING_EXPIRATION = 5;

module.exports = function(DataTypes, opts={}) {
  return {
    attributes: {
      last_state: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: opts.default || 'empty',
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
                $lt: moment().subtract(PING_EXPIRATION, 'minutes').toDate()
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
              lastPing < moment().subtract(PING_EXPIRATION, 'minutes')) {
            return 'unreachable';
          }
          return lastState;
        }
      }
    }
  };
};
