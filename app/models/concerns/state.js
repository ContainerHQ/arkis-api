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
      last_seen: {
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
                last_state: 'running', last_seen: { $gte: expired }
              };
              break;
            case 'unreachable':
              opts = {
                last_state: 'running', last_seen: { $lt: expired }
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
          let lastSeen  = this.getDataValue('last_seen'),
              lastState = this.getDataValue('last_state'),
              expirationTime = moment().subtract(EXPIRATION_TIME, 'minutes');

          if (lastState === 'running' &&
             (lastSeen  === null || lastSeen < expirationTime)) {
            return 'unreachable';
          }
          return lastState;
        }
      }
    }
  };
};
