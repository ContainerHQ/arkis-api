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
        defaultValue: true,
        validate: { len: [6, 128] }
      },
      userId: {
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
