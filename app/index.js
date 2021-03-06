'use strict';

let express = require('express'),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  multer = require('multer'),
  config = require('../config'),
  middlewares = require('./middlewares'),
  routes = require('./routes'),
  app = express();

app
.use(cors())
.use(bodyParser.json({ strict: false }))
.use(bodyParser.urlencoded({ extended: true }))
.use(multer())
.use(middlewares.resHandler)
.use(middlewares.authentication.initialize())
.use('/', routes.docker)
.use('/v:version', routes.docker)
.use('/api', routes.api)
.use(middlewares.errorHandler)
.listen(config.port, () => {
  if (config.logging) {
    console.log('Listenning on port: %s', config.port);
  }
})
.on('upgrade', routes.upgrade);

if (config.logging) {
  app.use(morgan(config.logger));
}

module.exports = app;
