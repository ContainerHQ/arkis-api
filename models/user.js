var _ = require('lodash'),
  bcrypt = require('bcrypt'),
  jwt = require('jsonwebtoken'),
  secrets = require('../config/secrets');

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
      defaultValue: null,
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
  }, {
    instanceMethods: {
      hashPassword: function() {
        this.password = bcrypt.hashSync(this.password, 10);
      },
      verifyPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
      },
      createToken: function() {
        let infos = _.pick(this.toJSON(), 'email');

        this.token = jwt.sign(infos, secrets.jwt);
      },
      verifyToken: function() {
        return this.token = jwt.verify(token, secrets.jwt);
      }
    },
    hooks: {
      beforeCreate: function(user, options, done) {
        user.hashPassword();
        user.createToken();
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

