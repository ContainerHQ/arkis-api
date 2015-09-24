'use strict';

var uniqueIndex = ['name', 'user_id'];

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
        }
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null,
        validate: { len: [1, 64] }
      },
      cert: {
        type: DataTypes.JSONB,
        allowNull: false,
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
        allowNull: false,
        defaultValue: null,
      },
      swarm_version: {
        type: DataTypes.STRING,
        allowNull: false,
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
      nodes_count: DataTypes.INTEGER,

      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    }).then(function () {
      return queryInterface.addIndex('Clusters', uniqueIndex, {
        indicesType: 'UNIQUE'
      });
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeIndex('Clusters', uniqueIndex, {
      indicesType: 'UNIQUE'
    }).then(function() {
      return queryInterface.dropTable('Clusters');
    });
  }
};
