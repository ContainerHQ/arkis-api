var express = require('express'),
    bodyParser = require('body-parser'),
    routes = require('./routes'),
    app = express(),
    port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use('/v1.17', routes.docker);

var server = app.listen(port);

server.on('upgrade', routes.upgrade);

console.log('Listenning on port: %s', port);
