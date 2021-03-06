'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('Nodes', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV1,
        unique: true
      },
      cluster_id: {
        type: DataTypes.UUID,
        references: {
          model: 'Clusters',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null,
        validate: { len: [1, 64] }
      },
      encrypted_token: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: null,
        unique: true
      },
      master: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      byon: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      region: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      size: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      public_ip: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        unique: true,
        validate: { isIP: true }
      },
      provider_id: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        unique: true
      },
      cpu: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
        validate: { min: 1 }
      },
      memory: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
        validate: { min: 128 }
      },
      disk: {
        type: DataTypes.REAL,
        defaultValue: null,
        allowNull: true,
        validate: { min: 1.0 }
      },
      labels: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      docker_version: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      swarm_version: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      last_state: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'empty',
        validate: {
          isIn: [['empty', 'deploying', 'upgrading', 'updating', 'running']]
        }
      },
      last_seen: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
      deployed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },

      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    }).then(function () {
      return queryInterface.addIndex('Nodes', ['name', 'cluster_id'], {
        indicesType: 'UNIQUE'
      });
    });
  },

  down: function (queryInterface) {
    return queryInterface.removeIndex('Nodes', ['name', 'cluster_id'], {
      indicesType: 'UNIQUE'
    }).then(function() {
      return queryInterface.dropTable('Nodes');
    });
  }
};
