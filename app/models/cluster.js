'use strict';

module.exports = function(sequelize, DataTypes) {
  let Cluster = sequelize.define('Cluster', {
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
    state: DataTypes.VIRTUAL,
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
      state_message: function() {
        //switch this.state
        return 'Create at least one node to work with this cluster';
      },
      containers_count: function() {
        return 0;
      }
    },
    hooks: {
      beforeDestroy: function(cluster) {
        if (cluster.state === 'upgrading') {
          return sequelize.Promise
            .reject(`Can't delete a cluster in ${cluster.state} state`);
        }
        return sequelize.Promise.resolve(cluster);
      },
      afterCreate: function(cluster) {
        return cluster.updateState();
      },
      afterFind: function(cluster) {
        if (!cluster) { return sequelize.Promise.resolve(); }

        return cluster.updateState();
      }
    },
    instanceMethods: {
      updateState: function() {
        if (this.nodes_count <= 0) {
          this.state = 'idle';
          return this;
        }
        return this.getNodes({ where: { state: 'upgrading' } })
        .then(nodes => {
          this.state = 'running';

          if (nodes.length > 0) {
           this.state = 'upgrading';
          }
          return this;
        });
      }
    },
    classMethods: {
      associate: function(models) {
        Cluster.hasMany(models.Node, {
          onDelete: 'cascade',
          counterCache: { as: 'nodes_count' }
        });
      }
    }
  });
  return Cluster;
};
