'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    queryInterface.createTable('Profiles', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fullname: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: { len: [6, 128] }
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    });
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('Profiles');
  }
};
