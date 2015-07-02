'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('Certs', {
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
      server_cert: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: null
      },
      server_key: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: null
      },
      server_ca: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: null
      },
      client_cert: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: null
      },
      client_key: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: null
      },
      client_ca: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: null
      },

      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });
  },

  down: function (queryInterface, DataTypes) {
    return queryInterface.dropTable('Certs');
  }
};
