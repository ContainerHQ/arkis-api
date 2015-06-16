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
      strategy: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'spread',
        validate: { isIn: [['spread', 'binpack', 'random']] }
      },

      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Clusters');
  }
};
