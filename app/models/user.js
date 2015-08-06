'use strict';

let bcrypt = require('bcrypt'),
  token = require('../../config/token');

module.exports = function(sequelize, DataTypes) {
  let User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: null,
      unique: true,
      validate: { isEmail: true }
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
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      unique: 'provider'
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
        User.hasOne(models.Profile,  { onDelete: 'cascade', hooks: true });
        User.hasMany(models.Cluster, { onDelete: 'cascade', hooks: true });
      }
    },
    hooks: {
      beforeCreate: function(user) {
        user.generateToken();
        return Promise.resolve(user);
      },
      afterCreate: function(user) {
        return user.createProfile();
      }
    }
  });
  return User;
};
