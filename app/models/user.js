'use strict';

let _ = require('lodash'),
  bcrypt = require('bcrypt'),
  connectors = require('../connectors'),
  token = require('../support').token,
  is = require('./validators');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: null,
      validate: _.merge({ isEmail: true },
        is.unique({ attribute: 'email' })
      )
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: null,
    },
    password: {
      type: DataTypes.VIRTUAL,
      allowNull: false,
      defaultValue: null,

      set: function(password) {
        /*
         * We must ensure to hit password validations first and then
         * that password_hash validations must never fail if the
         * password validations already failed.
         */
        let hash = bcrypt.hashSync(password || '*', 10);

        this.setDataValue('password', password);
        this.setDataValue('password_hash', hash);
      },
      validate: { len: [6, 128] }
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    provider_id: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      unique: true
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      unique: true
    },
    token_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: DataTypes.UUIDV1,
      unique: true
    },
    ssh_key: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    }
  }, {
    instanceMethods: {
      verifyPassword: function(password) {
        return bcrypt.compareSync(password, this.password_hash);
      },

      /* The encoded jwt token includes a unique universal identifier,
       * changing this identifier invalidates the token.
       *
       * This really simplify the token revokation if a user is destroyed
       * (in this case, a deleted user carries its token uuid to
       * programming heaven).
       */
      generateToken: function() {
        this.token = token.generate(this.token_id);
      },
      revokeToken: function() {
        this.token_id = sequelize.Utils.toDefaultValue(DataTypes.UUIDV1());
      }
    },
    classMethods: {
      associate: function(models) {
        this.hasOne(models.Profile);
        this.hasMany(models.Cluster);
        this.hasMany(models.UserProviderLink);
      }
    },
    hooks: {
      beforeCreate: function(user) {
        user.generateToken();

        return connectors.SSH.generateKey().then(key => {
          user.ssh_key = key;
        });
      }
    }
  });
};
