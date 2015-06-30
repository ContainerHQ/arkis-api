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
      state: {
        type: DataTypes.ENUM,
        allowNull: false,
        values: [
         'deploying', 'upgrading', 'starting', 'running', 'stopping', 'down'
        ],
        defaultValue: 'deploying',
      },
      master: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('Nodes');
  }
};
