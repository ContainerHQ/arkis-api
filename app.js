var express = require('express'),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  multer = require('multer'),
  routes = require('./routes'),
  app = express();

let port = process.env.PORT || 4000;

app
.use(cors())
.use(bodyParser.json({ strict: false }))
.use(bodyParser.urlencoded({ extended: true }))
.use(multer())
.use(morgan('combined'))
.use('/', routes.docker)
.use('/v:version', routes.docker)
.use('/api', routes.api)
.listen(port, () => {
  console.log('Listenning on port: %s', port);
})
.on('upgrade', routes.upgrade);

module.exports = app;
