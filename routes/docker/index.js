var express = require('express');

let router = express.Router();

router
.use('/containers', require('./containers'))
.use('/images', require('./images'))
.use('/exec', require('./exec'))
.use('/', require('./root'))

module.exports = router;
