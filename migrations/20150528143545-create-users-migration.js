'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true }
    });
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.dropTable('users');
  }
};
