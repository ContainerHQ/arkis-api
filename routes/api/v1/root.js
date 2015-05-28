var express = require('express');

let router = express.Router();

router
.post('/signup', (req, res) => {
  res.status(200).send({ name: 'mof le moche' });
});

module.exports = router;
