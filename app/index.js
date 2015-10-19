'use strict';

let express = require('express'),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  multer = require('multer'),
  config = require('../config'),
  jobs = require('./jobs'),
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

process.once('SIGTERM', () => {
  jobs.shutdown(5000, err => {
    if (config.logging) {
      console.log('Jobs queue shutdown: ', err || 'SUCCESS!');
    }
    process.exit(0);
  });
});

module.exports = app;
