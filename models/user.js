var bcrypt = require('bcrypt');

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
      encodePassword: function() {
        this.password = bcrypt.hashSync(this.password, SALT_COST);
      },
      verifyPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
      },
      /*
       * Verify if the user has just been created,
       * in order to respond with the proper HTTP
       * status code (201 Created / 200 OK).
       *
       */
      hasBeenCreated: function() {
        return this.options.isNewRecord;
      }
    },
    hooks: {
      beforeCreate: function(user, options, done) {
        user.encodePassword();
        done(null, user);
      },
      beforeUpdate: function(user, options, done) {
        user.encodePassword();
        done(null, user);
      }
    }
  });
};

