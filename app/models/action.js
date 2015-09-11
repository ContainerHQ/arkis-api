'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  concerns = require('./concerns');

const EXPIRATION_TIME = 5;
const CONCERNS = {
  serializable: {
    omit: ['cert', 'last_state', 'user_id', 'created_at', 'updated_at']
  }
};

module.exports = function(sequelize, DataTypes) {
  let { attributes, options } = concerns.extend({
    attributes: {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV1,
        unique: true
      },
      last_state: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'in-progress',
        validate: {
          isIn: [['in-progress', 'completed']]
        }
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null,
        validate: {
          isIn: [['deploy', 'update', 'upgrade']]
        }
      },
      resource: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null,
        validate: {
          isIn: [['node', 'cluster']]
        }
      },
      resource_id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }
    },
    options: {
      defaultScope: { order: [['id', 'ASC']] },
      scopes: {
        timeline: { order: [['started_at', 'DESC']] },
        pending: {
          where: { last_state: 'in-progress' },
          limit: 1
        },
        filtered: function(filters) {
          return { where: _.pick(filters, ['type']) };
        },
        state: function(state) {
          let expired = moment().subtract(EXPIRATION_TIME, 'minutes').toDate(),
            opts;

          switch (state) {
            case 'in-progress':
              opts = {
                last_state: 'in-progress', started_at: { $gte: expired }
              };
              break;
            case 'errored':
              opts = {
                last_state: 'in-progress', started_at: { $lt: expired }
              };
              break;
            default:
              opts = { last_state: { $like: state || '%' } };
          }
          return { where: opts };
        },
        node: function(id) {
          return { where: { resource: 'node', resource_id: id } };
        }
      },
      getterMethods: {
        state: function() {
          let lastState = this.getDataValue('last_state'),
            startedAt   = this.getDataValue('started_at'),
            expirationTime = moment().subtract(EXPIRATION_TIME, 'minutes');

          if (lastState === 'in-progress' && startedAt < expirationTime) {
            return 'errored';
          }
          return lastState;
        }
      },
      instanceMethods: {
        complete: function() {
          return this.update({
            last_state: 'completed', completed_at: moment()
          });
        }
      }
    }
  }, CONCERNS);
  return sequelize.define('Action', attributes, options);
};
