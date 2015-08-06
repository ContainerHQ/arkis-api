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
        validate: {
          isIn: [['empty', 'deploying', 'upgrading', 'updating', 'running']]
        }
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
          let lastPing  = this.getDataValue('last_ping'),
              lastState = this.getDataValue('last_state'),
              expirationTime = moment().subtract(PING_EXPIRATION, 'minutes');

          if (lastState === 'running' &&
             (lastPing  === null || lastPing < expirationTime)) {
            return 'unreachable';
          }
          return lastState;
        }
      }
    }
  };
};
