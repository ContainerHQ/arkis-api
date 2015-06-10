'use strict';

var Profile = require('../../app/models').Profile;

module.exports = function(factory) {
  factory.define('profile', Profile, {
    fullname: 'Luke Skywalker',
    user_id: factory.assoc('user', 'id')
  });
};
