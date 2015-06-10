'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('Profiles', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fullname: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: { len: [0, 128] }
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('Profiles');
  }
};
