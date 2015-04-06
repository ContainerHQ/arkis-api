var express = require('express'),
    bodyParser = require('body-parser'),
    DockerProxy = require('./lib/docker'),
    app = express(),
    port = process.env.PORT || 4000;

app.use(bodyParser.json());

app.use('/v1.17', require('./routes/docker'));

var server = app.listen(port);

var docker = new DockerProxy();

server.on('upgrade', function(req, socket) {
    docker.hijack(req, socket);
});

console.log('Listenning on port: %s', port);
