var express = require('express'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  multer = require('multer'),
  routes = require('./routes'),
  app = express();

let port = process.env.PORT || 4000;

app
  .use(bodyParser.json({ strict: false }))
  .use(bodyParser.urlencoded({ extended: true }))
  .use(multer())
  .use(morgan('combined'))
  .use('/:version?', routes.docker)
  .listen(port, () => {
    console.log('Listenning on port: %s', port);
  })
  .on('upgrade', routes.upgrade);
