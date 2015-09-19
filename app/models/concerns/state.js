'use strict';

let moment = require('moment');

module.exports = function({ attribute, expiration, DataTypes }) {
  let { when, mustBe, after, constraint } = expiration;

  let expiredAt = moment().subtract(after.amount, after.key).toDate();

  let stateMachine = {
    attributes: {},
    options: {
      scopes: {
        state: function(state) {
          let opts = {};

          switch (state) {
            case when:
              opts[attribute.name]  = when;
              opts[constraint.name] = { $gte: expiredAt };
              break;
            case mustBe:
              opts[attribute.name]  = when;
              opts[constraint.name] = { $lt: expiredAt };
              break;
            default:
              opts[attribute.name] = { $like: state || '%' };
          }
          return { where: opts };
        }
      },
      getterMethods: {
        state: function() {
          let previousState  = this.getDataValue(attribute.name),
              changedAt      = this.getDataValue(constraint.name);

          if (previousState === when &&
             (changedAt  === null || changedAt < expiredAt)) {
            return mustBe;
          }
          return previousState;
        }
      }
    }
  };
  stateMachine.attributes[attribute.name] = {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: attribute.default,
    validate: {
      isIn: [attribute.values]
    }
  };
  stateMachine.attributes[constraint.name] = {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes[constraint.default] || null
  };
  return stateMachine;
};
