'use strict';

let express = require('express'),
  Node = require('../../../models').Node;

let router = express.Router();

router
.param('token', (req, res, next) => {
  next();
})
.route('/:token')
.get('inspect', (req, res) => {
  res.noContent();
})
.post('register', (req, res) => {
  res.noContent();
})
.patch('live', (req, res) => {
  res.noContent();
});

module.exports = router;
