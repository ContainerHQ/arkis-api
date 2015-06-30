'use strict';

let express = require('express'),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  multer = require('multer'),
  middlewares = require('./middlewares'),
  routes = require('./routes'),
  app = express();

let port = process.env.PORT || 4000;

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
.listen(port, () => {
  console.log('Listenning on port: %s', port);
})
.on('upgrade', routes.upgrade);

switch (process.env.NODE_ENV || 'development') {
  case 'development':
    app.use(morgan('dev'));
    break;
  case 'production':
    app.use(morgan('combined'));
    break;
}

module.exports = app;
