var _ = require('lodash'),
  bcrypt = require('bcrypt'),
  jwt = require('jsonwebtoken'),
  secrets = require('../../config/secrets');

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
    token_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: DataTypes.UUIDV1,
      unique: true
    },
  }, {
    instanceMethods: {
      verifyPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
      },

      hashPassword: function() {
        this.password = bcrypt.hashSync(this.password, 10);
      },
      /*
       * The encoded jwt token includes a unique universal identifier,
       * changing this identifier invalidates the token.
       *
       * This really simplify the token revokation if a user is destroyed
       * (in this scenario, a deleted user carries its token uuid to
       * programming heaven.
       *
       */
      generateToken: function() {
        let payload = { user_id: this.id, jit: this.token_id };

        this.token = jwt.sign(payload, secrets.jwt);
      },
      revokeToken: function() {
        this.token_id = sequelize.Utils.toDefaultValue(DataTypes.UUIDV1());
      }
    },
    classMethods: {
      associate: function(models) {
        User.hasOne(models.Profile, { onDelete: 'cascade' });
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
      },
      afterCreate: function(user, options) {
        user.generateToken();

        return user.createProfile()
        .then(() => {
          return user.update({ token: user.token });
        });
      }
    }
  });
  return User;
};
