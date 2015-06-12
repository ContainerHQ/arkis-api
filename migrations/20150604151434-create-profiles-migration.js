'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('Profiles', {
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
      fullname: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: { len: [0, 64] }
      },
      company: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: { len: [0, 64] }
      },

      location: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: { len: [0, 64] }
      },

      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('Profiles');
  }
};
