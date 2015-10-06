'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('UserProviderLinks', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null,
        validate: {
          isIn: [['ssh_key']]
        }
      },
      provider_id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('UserProviderLinks');
  }
};
