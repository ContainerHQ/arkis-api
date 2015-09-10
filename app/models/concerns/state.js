'use strict';

let moment = require('moment');

/*
 * Ping expiration time (in minutes).
 */
const EXPIRATION_TIME = 5;

module.exports = function({ defaultState, DataTypes }) {
  return {
    attributes: {
      last_state: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: defaultState || 'empty',
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
          let expired = moment().subtract(EXPIRATION_TIME, 'minutes').toDate(),
            opts;

          switch (state) {
            case 'running':
              opts = {
                last_state: 'running', last_ping: { $gte: expired }
              };
              break;
            case 'unreachable':
              opts = {
                last_state: 'running', last_ping: { $lt: expired }
              };
              break;
            default:
              opts = { last_state: { $like: state || '%' } };
          }
          return { where: opts };
        }
      },
      getterMethods: {
        state: function() {
          let lastPing  = this.getDataValue('last_ping'),
              lastState = this.getDataValue('last_state'),
              expirationTime = moment().subtract(EXPIRATION_TIME, 'minutes');

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
