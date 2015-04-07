var express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    routes = require('./routes'),
    app = express();

var port = process.env.PORT || 4000;

app.use(bodyParser.json())
   .use(bodyParser.urlencoded({ extended: true }))
   .use(multer())
   .use('/v1.14', routes.docker)
   .use('/v1.15', routes.docker)
   .use('/v1.16', routes.docker)
   .use('/v1.17', routes.docker)
   .listen(port)
   .on('upgrade', routes.upgrade);

console.log('Listenning on port: %s', port);
