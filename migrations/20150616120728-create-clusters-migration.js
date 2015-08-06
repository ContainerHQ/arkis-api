'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('Clusters', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV1,
        unique: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
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
        allowNull: true,
        defaultValue: null,
        unique: true
      },
      cert: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
      },
      strategy: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'spread',
        validate: { isIn: [['spread', 'binpack', 'random']] }
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
      last_ping: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
      nodes_count: DataTypes.INTEGER,

      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    }).then(function () {
      return queryInterface.addIndex('Clusters', ['name', 'user_id'], {
        indicesType: 'UNIQUE'
      });
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeIndex('Clusters', ['name', 'user_id'], {
      indicesType: 'UNIQUE'
    }).then(function() {
      return queryInterface.dropTable('Clusters');
    });
  }
};
