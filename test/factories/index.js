'use strict';

var factory = require('factory-girl'),
  SequelizeAdapter = require('factory-girl-sequelize')();

factory.setAdapter(SequelizeAdapter);

var User = require('../../models').User;

factory.define('user', User, {
  email: 'max@furyroad.io',
  password: 'allm8tyMax'
});

factory.define('userWithoutPassword', User, {
  email: 'max@furyroad.io',
});

module.exports = factory;
