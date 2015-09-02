'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('Actions', {
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
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: null
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
      started_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });
  },

  down: function (queryInterface, DataTypes) {
    return queryInterface.dropTable('Actions');
  }
};
