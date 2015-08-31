'use strict';

let moment = require('moment');

const EXPIRATION_TIME = 5;

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Action', {
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
    ressource: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: null,
      validate: {
        isIn: [['Node', 'Cluster']]
      }
    },
    ressource_id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: null
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    createdAt: 'started_at',

    getterMethods: {
      state: function() {
        let lastState = this.getDataValue('last_state'),
          startedAt = this.getDataValue('started_at'),
          expirationTime = moment().subtract(EXPIRATION_TIME, 'minutes');

        if (lastState === 'in-progress' && startedAt < expirationTime) {
          return 'errored';
        }
        return lastState;
      }
    },
    instanceMethods: {
      complete: function() {
        return this.update({ last_state: 'completed', completed_at: moment() });
      }
    }
  });
};
