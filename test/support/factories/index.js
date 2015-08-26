'use strict';

let fs = require('fs'),
  path = require('path'),
  basename = path.basename(module.filename),
  factory = require('factory-girl'),
  SequelizeAdapter = require('factory-girl-sequelize')();

factory.setAdapter(SequelizeAdapter);

fs
.readdirSync(__dirname)
.filter(function(file) {
  return (file.indexOf('.') !== 0) && (file !== basename);
})
.forEach(function(file) {
  require(path.join(__dirname, file))(factory);
});

module.exports = factory;
