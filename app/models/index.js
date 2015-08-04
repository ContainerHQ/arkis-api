'use strict';

let fs      = require('fs'),
  path      = require('path'),
  Sequelize = require('sequelize'),
  basename  = path.basename(module.filename),
  config    = require('../../config'),
  db        = {};

let sequelize = new Sequelize(
  config.db.adapter,
  config.db.username,
  config.db.password,
  config.db
);

fs
.readdirSync(__dirname)
.filter(function(file) {
  return (file.indexOf('.') !== 0) && (file !== basename);
})
.forEach(function(file) {
  let filepath = path.join(__dirname, file);

  if (!fs.lstatSync(filepath).isFile()) {
    return;
  }

  let model = sequelize['import'](filepath);

  db[model.name] = model;
});

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
