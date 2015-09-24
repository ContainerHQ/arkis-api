'use strict';

let concerns = require('./concerns');

let CONCERNS = { serializable: { omit: ['user_id'] } };

module.exports = function(sequelize, DataTypes) {
  let { attributes, options } = concerns.extend({
    attributes: {
     id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       autoIncrement: true
     },
     fullname: {
       type: DataTypes.STRING,
       allowNull: true,
       defaultValue: null,
       validate: { len: [0, 64] }
     },
     company: {
       type: DataTypes.STRING,
       allowNull: true,
       defaultValue: null,
       validate: { len: [0, 64] }
     },
     location: {
       type: DataTypes.STRING,
       allowNull: true,
       defaultValue: null,
       validate: { len: [0, 64] }
     }
    }
  }, CONCERNS);
  return sequelize.define('Profile', attributes, options);
};
