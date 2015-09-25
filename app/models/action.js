'use strict';

let _ = require('lodash'),
  config = require('../../config'),
  concerns = require('./concerns');

const CONCERNS = {
  serializable: {
    omit: ['cert', 'last_state', 'user_id', 'created_at', 'updated_at']
  },
  state: {
    attribute: {
      name: 'last_state',
      default: 'in-progress',
      values: ['in-progress', 'completed']
    },
    expiration: {
      when: 'in-progress',
      mustBe: 'errored',
      constraint: {
        name: 'started_at',
        default: 'NOW'
      },
      after: config.agent.heartbeat,
    }
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
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }
    },
    options: {
      defaultScope: { order: [['id', 'ASC']] },
      scopes: {
        timeline: { order: [['started_at', 'DESC'], ['id', 'ASC']] },
        pending: {
          where: { last_state: 'in-progress' },
          limit: 1
        },
        filtered: function(filters) {
          return { where: _.pick(filters, ['type']) };
        },
        node: function(id) {
          return { where: { resource: 'node', resource_id: id } };
        }
      },
      instanceMethods: {
        complete: function() {
          return this.update(
            { last_state: 'completed', completed_at: Date.now() }
          );
        }
      }
    }
  }, CONCERNS, { DataTypes: DataTypes });
  return sequelize.define('Action', attributes, options);
};
