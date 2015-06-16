'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Cluster', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV1,
      unique: true
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
      validate: {
        isIn: {
          args: [['spread', 'binpack', 'random']],
          msg: 'Must be spread, binback or random'
        }
      }
    }
  }, {
    getterMethods: {
      state: function() {
        return 'idle';
      },
      state_message: function() {
        return 'Create at least one node to work with this cluster';
      },
      containers_count: function() {
        return 0;
      }
    },
    hooks: {
      beforeDestroy: function(cluster) {
        console.log(cluster.state);
        return sequelize.Promise.resolve(cluster);
      }
    },
    classMethods: {
      associate: function() {
        //Cluster.hasMany(models.Node, {
        //  onDelete: 'cascade',
        //  counterCache: true
        //});
        //
        //Test counterCache increase/decrease
      }
    }
  });
};
