var bcrypt = require('bcrypt');

const SALT_COST = 10;

module.exports = function(sequelize, Sequelize) {
  let User = sequelize.define('user', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: null,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: null
    }
  }, {
    instanceMethods: {
      verifyPassword: function (password) {
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
    }
  });
  User.hashPassword = function(password) {
    return bcrypt.hashSync(password, SALT_COST);
  };
  return User;
};

