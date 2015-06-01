var _ = require('lodash'),
  bcrypt = require('bcrypt'),
  jwt = require('jsonwebtoken'),
  secrets = require('../config/secrets');

const SALT_COST = 10;

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
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: null
    }
  }, {
    instanceMethods: {
      hashPassword: function() {
        this.password = bcrypt.hashSync(this.password, SALT_COST);
      },
      verifyPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
      },
      createToken: function() {
        return jwt.sign(this, secrets.jwt);
      }
    },
    hooks: {
      beforeCreate: function(user, options, done) {
        user.hashPassword();
        done(null, user);
      },
      beforeUpdate: function(user, options, done) {
        if (_.contains(options.fields, 'password')) {
          user.hashPassword();
        }
        done(null, user);
      }
    }
  });
};

