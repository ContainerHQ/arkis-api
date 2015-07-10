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
        },
        onDelete: 'CASCADE'
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null,
        validate: { len: [1, 64] }
      },
      token: {
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
      node_size: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      fqdn: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
        defaultValue: null,
        validate: { isUrl: true }
      },
      public_ip: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: { isIP: true }
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
        validate: { isIn: [['empty', 'deploying', 'upgrading', 'running']] }
      },
      last_ping: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },

      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    })
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('Nodes');
  }
};
